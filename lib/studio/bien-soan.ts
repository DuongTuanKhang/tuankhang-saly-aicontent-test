import { createRepo } from '@/lib/data-access';
import { chayNhiemVu } from '@/lib/model-runner';

import type { KetQuaStudio } from './kieu';

export type BanNhapBienSoan = {
  tieuDe: string;
  noiDung: string;
};

export type ThamSoSinhNoiDung = {
  workspaceId: string;
  ideaId: string;
};

function chuoiKhongRong(giaTri: unknown): string | null {
  if (typeof giaTri !== 'string') return null;
  const daCat = giaTri.trim();
  return daCat === '' ? null : daCat;
}

function donBanNhapBienSoan(duLieuTho: unknown): BanNhapBienSoan | null {
  if (!duLieuTho || typeof duLieuTho !== 'object' || Array.isArray(duLieuTho)) return null;

  const duLieu = duLieuTho as Record<string, unknown>;
  const tieuDe = chuoiKhongRong(duLieu.tieuDe);
  const noiDung = chuoiKhongRong(duLieu.noiDung);
  if (!tieuDe || !noiDung) return null;

  return { tieuDe, noiDung };
}

/**
 * Sinh ban nhap bai viet tu mot idea da luu. Moi ban ghi duoc doc qua repo da
 * gan workspace; browser khong duoc truyen metadata vao payload mo hinh.
 */
export async function sinhNoiDung(
  thamSo: ThamSoSinhNoiDung,
): Promise<KetQuaStudio<BanNhapBienSoan>> {
  const repo = createRepo(thamSo.workspaceId);
  const idea = await repo.yTuong.layTheoId(thamSo.ideaId);
  if (!idea) {
    return { ok: false, loi: 'Khong tim thay y tuong.', jobId: null };
  }

  const [hoSo, truCot, chanDung, sanPham] = await Promise.all([
    repo.hoSo.lay(),
    idea.pillarId ? repo.truCot.layTheoId(idea.pillarId) : Promise.resolve(null),
    idea.personaId ? repo.chanDung.layTheoId(idea.personaId) : Promise.resolve(null),
    idea.productId ? repo.sanPham.layTheoId(idea.productId) : Promise.resolve(null),
  ]);

  const chay = await chayNhiemVu({
    nhiemVu: 'viet-bai',
    khongGianLamViec: thamSo.workspaceId,
    duLieuVao: {
      bienThe: idea.beMat,
      yTuong: {
        tieuDe: idea.tieuDe,
        gocTiepCan: idea.gocTiepCan,
        cauMoDau: idea.cauMoDau,
        lyDoDeXuat: idea.lyDoDeXuat,
      },
      hoSo: hoSo
        ? { moTa: hoSo.moTa, giongDieu: hoSo.giongDieu, dieuCamKy: hoSo.dieuCamKy }
        : null,
      truCot: truCot ? { ten: truCot.ten, mucDich: truCot.mucDich } : null,
      chanDung: chanDung
        ? {
            ten: chanDung.ten,
            doTuoi: chanDung.doTuoi,
            ngheNghiep: chanDung.ngheNghiep,
            noiDau: chanDung.noiDau,
            mongMuon: chanDung.mongMuon,
            cauNoiThuongDung: chanDung.cauNoiThuongDung,
          }
        : null,
      sanPham: sanPham
        ? {
            ten: sanPham.ten,
            gia: sanPham.gia,
            loiIch: sanPham.loiIch,
            phanDoiThuongGap: sanPham.phanDoiThuongGap,
            loiKeuGoi: sanPham.loiKeuGoi,
          }
        : null,
    },
  });

  if (chay.trangThai !== 'xong' || !chay.ketQua) {
    return { ok: false, loi: 'Khong the sinh noi dung luc nay. Vui long thu lai sau.', jobId: chay.jobId };
  }

  const banNhap = donBanNhapBienSoan(chay.ketQua);
  if (!banNhap) {
    return {
      ok: false,
      loi: 'Ket qua sinh noi dung khong hop le. Vui long thu lai sau.',
      jobId: chay.jobId,
    };
  }

  return { ok: true, ketQua: banNhap, jobId: chay.jobId, moHinh: chay.moHinh };
}
