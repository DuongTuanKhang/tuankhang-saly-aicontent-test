'use server';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { trongGiaoDich } from '@/lib/data-access';
import { deXuatYTuong, luuDeXuatTrongGiaoDich } from '@/lib/studio/de-xuat';
import type { BeMat, KetQuaLuu, KetQuaStudio, UngVienDeXuat, YTuongDeXuat } from '@/lib/studio/kieu';

const BE_MAT_HOP_LE: readonly BeMat[] = [
  'fanpage',
  'ho_so_ca_nhan',
  'tiktok',
  'zalo',
];

function laBeMat(beMat: unknown): beMat is BeMat {
  return typeof beMat === 'string' && BE_MAT_HOP_LE.includes(beMat as BeMat);
}

function laUUID(giaTri: unknown): giaTri is string {
  if (typeof giaTri !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(giaTri);
}

/** Sinh de xuat cho workspace cua phien hien tai. */
export async function taoDeXuat(
  beMat: unknown,
  soLuong: unknown,
): Promise<KetQuaStudio<YTuongDeXuat[]>> {
  if (!laBeMat(beMat)) {
    return { ok: false, loi: 'Be mat khong hop le.', jobId: null };
  }
  if (typeof soLuong !== 'number' || !Number.isInteger(soLuong) || soLuong < 1 || soLuong > 20) {
    return { ok: false, loi: 'So luong y tuong phai tu 1 den 20.', jobId: null };
  }

  try {
    const workspaceId = await workspaceHienTai();
    await nguoiDungHienTai();
    return deXuatYTuong({ workspaceId, beMat, soLuong });
  } catch {
    return {
      ok: false,
      loi: 'Khong the de xuat y tuong luc nay. Vui long thu lai sau.',
      jobId: null,
    };
  }
}

/**
 * Luu chi tu candidate server-owned. Candidate duoc claim truoc moi ghi va
 * claim, ideas, trend usage deu o trong mot giao dich workspace-scoped.
 */
async function luuYTuongThaoTac(workspaceId: string, jobId: string): Promise<KetQuaLuu> {
  try {
    return trongGiaoDich(workspaceId, async (repo) => {
      const job = await repo.jobs.layTheoId(jobId);
      if (!job) {
        return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.' };
      }
      if (job.trangThai !== 'xong') {
        return { ok: false, loi: 'Cong viec chua hoan tat.' };
      }

      const ungVien = await repo.jobs.layUngVienDeXuat(jobId);
      if (!ungVien) {
        return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.' };
      }
      if (ungVien.trangThai === 'da_luu') {
        return { ok: true, soYTuong: ungVien.yTuong?.length ?? 0 };
      }
      if (ungVien.trangThai !== 'san_sang_luu') {
        return { ok: false, loi: 'Y tuong chua san sang luu.' };
      }

      const yTuong = ungVien.yTuong;
      if (!yTuong || yTuong.length === 0) {
        return { ok: false, loi: 'Khong co y tuong de luu.' };
      }

      /*
       * Conditional UPDATE locks this job row until commit. A concurrent
       * request can only observe `da_luu` after this transaction commits; an
       * exception below rolls the claim back to `san_sang_luu`.
       */
      const ungVienDaLuu: UngVienDeXuat = { ...ungVien, trangThai: 'da_luu' };
      const daClaim = await repo.jobs.chuyenTrangThaiUngVienDeXuat(
        jobId,
        'san_sang_luu',
        ungVienDaLuu,
      );
      if (!daClaim) {
        const ungVienSauTranhChap = await repo.jobs.layUngVienDeXuat(jobId);
        if (ungVienSauTranhChap?.trangThai === 'da_luu') {
          return { ok: true, soYTuong: ungVienSauTranhChap.yTuong?.length ?? 0 };
        }
        return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.' };
      }

      const [truCot, chanDung] = await Promise.all([
        repo.truCot.list(),
        repo.chanDung.list(),
      ]);
      await luuDeXuatTrongGiaoDich(repo, { yTuong, truCot, chanDung, jobId });

      const trendSignalIds = yTuong
        .map((y) => y.nguonXuHuong?.trendSignalId)
        .filter((id): id is string => id !== null && id !== undefined);
      if (trendSignalIds.length > 0) {
        await repo.tinHieuXuHuong.danhDauDaDung([...new Set(trendSignalIds)]);
      }

      return { ok: true, soYTuong: yTuong.length };
    });
  } catch {
    return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.' };
  }
}

/**
 * Browser input is only the opaque job ID. Workspace and candidate data are
 * always reloaded through the authenticated, workspace-scoped repository.
 */
export async function luuYTuongDeXuat(jobId: unknown): Promise<KetQuaLuu> {
  if (!laUUID(jobId)) {
    return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.' };
  }

  try {
    const workspaceId = await workspaceHienTai();
    await nguoiDungHienTai();
    return luuYTuongThaoTac(workspaceId, jobId);
  } catch {
    return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.' };
  }
}
