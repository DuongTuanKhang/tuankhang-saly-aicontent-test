/** Bon be mat co trong enum `be_mat` cua luoc do. */
export type BeMat = 'fanpage' | 'ho_so_ca_nhan' | 'tiktok' | 'zalo';

/**
 * Ket qua nghiep vu studio co cung dang voi cac ket qua bat dong bo khac:
 * thanh cong co du lieu va nhan mo hinh, that bai giu loi va job neu da day.
 */
export type KetQuaStudio<T> =
  | { ok: true; ketQua: T; jobId: string; moHinh: string }
  | { ok: false; loi: string; jobId: string | null };

/** Nguon xu huong da duoc gan bang ma, khong phai do mo hinh tu nhan. */
export type NguonXuHuongDeXuat = {
  trendSignalId: string;
  tieuDe: string | null;
  lienKet: string | null;
  tenKenh: string | null;
};

/** Mot y tuong da duoc doi chieu voi du lieu ho so cua workspace. */
export type YTuongDeXuat = {
  tieuDe: string;
  truCot: string | null;
  chanDung: string | null;
  gocTiepCan: string | null;
  cauMoDau: string | null;
  lyDoDeXuat: string | null;
  beMat: BeMat;
  khamPha: boolean;
  nguonXuHuong: NguonXuHuongDeXuat | null;
};

/**
 * Ban chup ung vien chi may chu duoc phep ghi vao job de-xuat.
 * `workspaceId` nam o dong jobs; cac ID tru cot, chan dung va model run duoc
 * truy xuat va doi chieu lai luc luu, khong nam trong ban chup nay.
 */
export type UngVienDeXuat = {
  loai: 'studio-de-xuat-v1';
  jobId: string;
  trangThai: 'dang_cho_ket_qua' | 'san_sang_luu' | 'da_luu';
  yTuong: YTuongDeXuat[] | null;
  nguonXuHuong: NguonXuHuongDeXuat | null;
};

/** Result of saving a proposal candidate to ideas. */
export type KetQuaLuu =
  | { ok: true; soYTuong: number }
  | { ok: false; loi: string };
