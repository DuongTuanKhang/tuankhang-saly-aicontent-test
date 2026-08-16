'use server';

import { revalidatePath } from 'next/cache';

import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { nguoiDungHienTai } from '@/lib/auth/nguoi-dung-tu-phien';
import { createRepo } from '@/lib/data-access';
import { sinhNoiDung as sinhBanNhapNoiDung, type BanNhapBienSoan } from '@/lib/studio/bien-soan';
import type { KetQuaStudio } from '@/lib/studio/kieu';

type KetQuaLuuNoiDung = { ok: true; noiDungId: string } | { ok: false; loi: string };

function laUUID(giaTri: unknown): giaTri is string {
  return (
    typeof giaTri === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(giaTri)
  );
}

function noiDungHopLe(giaTri: unknown): giaTri is string {
  return typeof giaTri === 'string' && giaTri.trim().length > 0;
}

/** Browser chi gui ID opaque; service tu doc idea va context da scope. */
export async function sinhNoiDung(ideaId: unknown): Promise<KetQuaStudio<BanNhapBienSoan>> {
  if (!laUUID(ideaId)) {
    return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.', jobId: null };
  }

  try {
    const workspaceId = await workspaceHienTai();
    return await sinhBanNhapNoiDung({ workspaceId, ideaId });
  } catch {
    return { ok: false, loi: 'Khong the sinh noi dung luc nay. Vui long thu lai sau.', jobId: null };
  }
}

/**
 * Noi dung la phan duy nhat nguoi dung duoc phep sua va gui lai. Tat ca
 * metadata cua `contents` deu duoc tai lai tu idea workspace-scoped.
 */
export async function luuNoiDung(ideaId: unknown, noiDung: unknown): Promise<KetQuaLuuNoiDung> {
  if (!laUUID(ideaId) || !noiDungHopLe(noiDung)) {
    return { ok: false, loi: 'Noi dung can duoc nhap truoc khi luu.' };
  }

  try {
    const [workspaceId, nguoiDung] = await Promise.all([workspaceHienTai(), nguoiDungHienTai()]);
    const repo = createRepo(workspaceId);
    const idea = await repo.yTuong.layTheoId(ideaId);
    if (!idea) {
      return { ok: false, loi: 'Khong the thuc hien yeu cau nay luc nay.' };
    }

    const banGhi = await repo.contents.tao({
      ideaId: idea.id,
      beMat: idea.beMat,
      pillarId: idea.pillarId,
      personaId: idea.personaId,
      productId: idea.productId,
      gocTiepCan: idea.gocTiepCan,
      nguonYTuong: idea.nguonYTuong,
      cauMoDau: idea.cauMoDau,
      noiDung: noiDung.trim(),
      nguoiTao: nguoiDung.userId,
    });

    revalidatePath('/studio/bien-soan');
    return { ok: true, noiDungId: banGhi.id };
  } catch {
    return { ok: false, loi: 'Khong the luu noi dung luc nay. Vui long thu lai sau.' };
  }
}
