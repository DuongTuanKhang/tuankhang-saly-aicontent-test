import { nguoiDungHienTai } from "@/lib/auth/nguoi-dung-tu-phien";
import { randomUUID } from "node:crypto";
import { kiemTraDeXuat } from "@/lib/brand/do-day-du";
import { bocCongThucChoBaiMoi } from "@/lib/studio/boc-cong-thuc";
import { chayNhiemVu } from "@/lib/model-runner";
import { createRepo } from "@/lib/data-access";
import type { Repo } from "@/lib/data-access";

import type { TruCot } from "@/lib/data-access/content-pillars";
import type { ChanDung } from "@/lib/data-access/personas";
import type { Insight } from "@/lib/data-access/insights";
import type { SanPham } from "@/lib/data-access/products";

import type {
  BeMat,
  KetQuaStudio,
  NguonXuHuongDeXuat,
  UngVienDeXuat,
  YTuongDeXuat,
} from "./kieu";

/** Ty le y tuong thu tuyen moi, chua co du lieu kiem chung. */
export const TI_LE_KHAM_PHA = 0.2;

export type ThamSoDeXuat = {
  workspaceId: string;
  beMat: BeMat;
  soLuong: number;
};

export type TruCotMucTieu = {
  ten: string;
  tiLeMucTieu: number | null;
};

const BE_MAT_HOP_LE: readonly BeMat[] = [
  "fanpage",
  "ho_so_ca_nhan",
  "tiktok",
  "zalo",
];

type YTuongTho = {
  tieuDe?: unknown;
  truCot?: unknown;
  chanDung?: unknown;
  gocTiepCan?: unknown;
  cauMoDau?: unknown;
  lyDoDeXuat?: unknown;
  beMat?: unknown;
  kham_pha?: unknown;
};

type DuLieuHocXuHuong = {
  congThuc: {
    kieuHook: string | null;
    chuDe: string[];
    soChu: number;
    coCTA: boolean;
  };
  diemLienQuan: number | null;
};

type NguCanhDeXuatTheoXuHuong = {
  nguon: NguonXuHuongDeXuat;
  duLieuHoc: DuLieuHocXuHuong;
};

function chuoiHoacNull(giaTri: unknown): string | null {
  if (typeof giaTri !== "string") return null;

  const sach = giaTri.trim();

  return sach === "" ? null : sach;
}

function laBeMat(giaTri: unknown): giaTri is BeMat {
  return typeof giaTri === "string" && BE_MAT_HOP_LE.includes(giaTri as BeMat);
}

function tapTenCoThat(ten: readonly string[]): Set<string> {
  return new Set(ten.map(chuoiHoacNull).filter((m): m is string => m !== null));
}

/**
 * Chi trich dung bon truong cong thuc va diem lien quan da duoc boc truoc do.
 * Khong dua ID, URL, ten kenh hay bat ky van ban bai goc nao vao loi goi de xuat.
 */
function duLieuHocTuCongThuc(congThuc: unknown, diemLienQuan: unknown): DuLieuHocXuHuong | null {
  if (!congThuc || typeof congThuc !== "object") return null;

  const tho = congThuc as Record<string, unknown>;
  if (typeof tho.soChu !== "number" || !Number.isFinite(tho.soChu) || typeof tho.coCTA !== "boolean") {
    return null;
  }

  const chuDe = Array.isArray(tho.chuDe)
    ? tho.chuDe.map(chuoiHoacNull).filter((chu): chu is string => chu !== null).slice(0, 4)
    : [];
  const kieuHook = chuoiHoacNull(tho.kieuHook);

  return {
    congThuc: {
      kieuHook,
      chuDe,
      soChu: Math.max(0, Math.floor(tho.soChu)),
      coCTA: tho.coCTA,
    },
    diemLienQuan:
      typeof diemLienQuan === "number" && Number.isFinite(diemLienQuan)
        ? Math.max(0, Math.min(100, Math.round(diemLienQuan)))
        : null,
  };
}

function taoNguCanhDeXuatTheoXuHuong(tin: {
  id: string;
  tieuDe: string;
  lienKet: string | null;
  tenKenh: string | null;
  congThuc: unknown;
  diemLienQuan: unknown;
}): NguCanhDeXuatTheoXuHuong | null {
  const duLieuHoc = duLieuHocTuCongThuc(tin.congThuc, tin.diemLienQuan);
  if (!duLieuHoc) return null;

  return {
    nguon: {
      trendSignalId: tin.id,
      tieuDe: chuoiHoacNull(tin.tieuDe),
      lienKet: chuoiHoacNull(tin.lienKet),
      tenKenh: chuoiHoacNull(tin.tenKenh),
    },
    duLieuHoc,
  };
}

function ganNguonXuHuong(
  yTuong: YTuongDeXuat[],
  nguon: NguonXuHuongDeXuat | null,
): YTuongDeXuat[] {
  return yTuong.map((muc) => ({ ...muc, nguonXuHuong: nguon }));
}

function laNguonXuHuongDeXuat(giaTri: unknown): giaTri is NguonXuHuongDeXuat {
  if (!giaTri || typeof giaTri !== "object") return false;
  const nguon = giaTri as Record<string, unknown>;
  return (
    typeof nguon.trendSignalId === "string" &&
    (nguon.tieuDe === null || typeof nguon.tieuDe === "string") &&
    (nguon.lienKet === null || typeof nguon.lienKet === "string") &&
    (nguon.tenKenh === null || typeof nguon.tenKenh === "string")
  );
}

function laUngVienDeXuat(giaTri: unknown): giaTri is UngVienDeXuat {
  if (!giaTri || typeof giaTri !== "object") return false;
  const ungVien = giaTri as Record<string, unknown>;
  return (
    ungVien.loai === "studio-de-xuat-v1" &&
    typeof ungVien.jobId === "string" &&
    (ungVien.trangThai === "dang_cho_ket_qua" ||
      ungVien.trangThai === "san_sang_luu" ||
      ungVien.trangThai === "da_luu") &&
    (ungVien.yTuong === null || Array.isArray(ungVien.yTuong)) &&
    (ungVien.nguonXuHuong === null || laNguonXuHuongDeXuat(ungVien.nguonXuHuong))
  );
}

/**
 * Don ket qua mo hinh thanh y tuong co the hien thi an toan.
 *
 * Tru cot va chan dung la ten tu do mo hinh tra ve, nen bat buoc doi chieu voi
 * danh sach cua workspace. Khong khop thi de `null`, khong tu tao them du lieu
 * ho so chi de lam ket qua dep hon.
 */
export function donKetQuaDeXuat(
  tho: unknown,
  truCotCoThat: readonly string[] = [],
  chanDungCoThat: readonly string[] = [],
  beMatYeuCau?: BeMat,
): YTuongDeXuat[] {
  const mang = (tho as { yTuong?: unknown })?.yTuong;

  if (!Array.isArray(mang)) return [];

  const truCotHopLe = tapTenCoThat(truCotCoThat);
  const chanDungHopLe = tapTenCoThat(chanDungCoThat);

  const ketQua: YTuongDeXuat[] = [];

  for (const muc of mang) {
    if (!muc || typeof muc !== "object") continue;

    const thoYTuong = muc as YTuongTho;

    const tieuDe = chuoiHoacNull(thoYTuong.tieuDe);

    if (!tieuDe || !laBeMat(thoYTuong.beMat)) continue;

    if (beMatYeuCau && thoYTuong.beMat !== beMatYeuCau) {
      continue;
    }

    const truCot = chuoiHoacNull(thoYTuong.truCot);
    const chanDung = chuoiHoacNull(thoYTuong.chanDung);

    ketQua.push({
      tieuDe,

      truCot: truCot && truCotHopLe.has(truCot) ? truCot : null,

      chanDung: chanDung && chanDungHopLe.has(chanDung) ? chanDung : null,

      gocTiepCan: chuoiHoacNull(thoYTuong.gocTiepCan),

      cauMoDau: chuoiHoacNull(thoYTuong.cauMoDau),

      lyDoDeXuat: chuoiHoacNull(thoYTuong.lyDoDeXuat),

      beMat: thoYTuong.beMat,

      khamPha: thoYTuong.kham_pha === true,

      // Nguon chi duoc gan SAU khi biet chinh xac loi goi nay dung trend nao.
      nguonXuHuong: null,
    });
  }

  return ketQua;
}

type ChiTieuTruCot = {
  ten: string;
  trongSo: number;
  chiTieu: number;
  phanDu: number;
  thuTu: number;
};

function chiTieuTheoTiLe(
  truCotMucTieu: TruCotMucTieu[],
  soLuong: number,
): ChiTieuTruCot[] {
  const daCo = new Set<string>();

  const truCot = truCotMucTieu.flatMap((muc, thuTu) => {
    const ten = chuoiHoacNull(muc.ten);

    if (!ten || daCo.has(ten)) {
      return [];
    }

    daCo.add(ten);

    const trongSo =
      Number.isFinite(muc.tiLeMucTieu) && (muc.tiLeMucTieu ?? 0) > 0
        ? (muc.tiLeMucTieu as number)
        : 0;

    return [
      {
        ten,
        trongSo,
        thuTu,
      },
    ];
  });

  if (truCot.length === 0) return [];

  const tongTrongSo = truCot.reduce((tong, muc) => tong + muc.trongSo, 0);

  const trongSoMacDinh = tongTrongSo > 0 ? null : 1;

  const tong = tongTrongSo > 0 ? tongTrongSo : truCot.length;

  const ketQua = truCot.map((muc) => {
    const trongSo = trongSoMacDinh ?? muc.trongSo;

    const lyTuong = (soLuong * trongSo) / tong;

    return {
      ...muc,
      trongSo,
      chiTieu: Math.floor(lyTuong),
      phanDu: lyTuong % 1,
    };
  });

  let conLai = soLuong - ketQua.reduce((tong, muc) => tong + muc.chiTieu, 0);

  for (const muc of [...ketQua].sort(
    (a, b) => b.phanDu - a.phanDu || a.thuTu - b.thuTu,
  )) {
    if (conLai <= 0) break;

    muc.chiTieu += 1;
    conLai -= 1;
  }

  return ketQua;
}

/**
 * Chon toi da N y tuong theo ty le tru cot.
 *
 * Khi mo hinh tra thieu y tuong cua mot tru cot, phan con thieu duoc lay tu
 * y tuong chua dung — khong sao chep hay tu tao mot y tuong de dap ung chi tieu.
 */
export function raiTheoTruCot(
  yTuongTho: YTuongDeXuat[],
  truCotMucTieu: TruCotMucTieu[],
  soLuong: number,
): YTuongDeXuat[] {
  const gioiHan = Number.isFinite(soLuong)
    ? Math.max(0, Math.floor(soLuong))
    : 0;

  if (gioiHan === 0 || yTuongTho.length === 0) {
    return [];
  }

  const chiTieu = chiTieuTheoTiLe(truCotMucTieu, gioiHan);

  if (chiTieu.length === 0) {
    return yTuongTho.slice(0, gioiHan);
  }

  const daChon = new Set<number>();
  const ketQua: YTuongDeXuat[] = [];

  for (const muc of chiTieu) {
    for (let i = 0; i < yTuongTho.length && ketQua.length < gioiHan; i += 1) {
      if (
        daChon.has(i) ||
        yTuongTho[i].truCot !== muc.ten ||
        muc.chiTieu <= 0
      ) {
        continue;
      }

      daChon.add(i);
      ketQua.push(yTuongTho[i]);
      muc.chiTieu -= 1;
    }
  }

  for (let i = 0; i < yTuongTho.length && ketQua.length < gioiHan; i += 1) {
    if (daChon.has(i)) continue;

    daChon.add(i);
    ketQua.push(yTuongTho[i]);
  }

  return ketQua;
}

export type ThamSoLuuDeXuat = {
  /** Chi nhan gia tri da duoc may chu xac thuc va cam vao service. */
  workspaceId: string;
  yTuong: YTuongDeXuat[];
  truCot: TruCot[];
  chanDung: ChanDung[];
  jobId: string;
};

export type ThamSoLuuDeXuatTrongGiaoDich = Omit<ThamSoLuuDeXuat, "workspaceId">;

function chiSoIdTheoTen(muc: readonly { id: string; ten: string }[]): Map<string, string> {
  const theoTen = new Map<string, string>();

  for (const dong of muc) {
    const ten = chuoiHoacNull(dong.ten);
    if (ten) theoTen.set(ten, dong.id);
  }

  return theoTen;
}

/**
 * Luu cac y tuong da sinh TU PHIA MAY CHU.
 *
 * Ham nay chi nhan ket qua da duoc don va gan nguon trong service Studio; no
 * khong phai server action va khong dung du lieu ID do trinh duyet gui len.
 */
export async function luuDeXuatTrongGiaoDich(
  repo: Repo,
  {
  yTuong,
  truCot,
  chanDung,
  jobId,
  }: ThamSoLuuDeXuatTrongGiaoDich,
): Promise<void> {
  const modelRun = await repo.modelRuns.layTheoJob(jobId);
  const idTruCotTheoTen = chiSoIdTheoTen(truCot);
  const idChanDungTheoTen = chiSoIdTheoTen(chanDung);

  await Promise.all(
    yTuong.map(async (muc) => {
      const trendSignalId = muc.nguonXuHuong?.trendSignalId ?? null;

      await repo.yTuong.tao({
        tieuDe: muc.tieuDe,
        beMat: muc.beMat,
        gocTiepCan: muc.gocTiepCan,
        pillarId: muc.truCot ? idTruCotTheoTen.get(muc.truCot) ?? null : null,
        personaId: muc.chanDung ? idChanDungTheoTen.get(muc.chanDung) ?? null : null,
        cauMoDau: muc.cauMoDau,
        lyDoDeXuat: muc.lyDoDeXuat,
        nguonYTuong: trendSignalId ? 'xu-huong' : 'may-de-xuat',
        trendSignalId,
        modelRunId: modelRun?.id ?? null,
        khamPha: muc.khamPha,
      });
    }),
  );
}

/** Ban dung ngoai giao dich cho cac luong da co. */
export async function luuDeXuat({ workspaceId, ...thamSo }: ThamSoLuuDeXuat): Promise<void> {
  return luuDeXuatTrongGiaoDich(createRepo(workspaceId), thamSo);
}

/**
 * Cua chinh cua milestone 1.
 *
 * Tat ca du lieu duoc doc qua createRepo(workspaceId).
 *
 * Bai follow chi duoc dua vao model duoi dang chu de + cong thuc,
 * khong dua noi dung bai goc vao payload de xuat.
 */
export async function deXuatYTuong(
  thamSo: ThamSoDeXuat,
): Promise<KetQuaStudio<YTuongDeXuat[]>> {
  const workspaceId = thamSo.workspaceId?.trim();

  if (!workspaceId) {
    return {
      ok: false,
      loi: "workspaceId bat buoc.",
      jobId: null,
    };
  }

  if (!BE_MAT_HOP_LE.includes(thamSo.beMat)) {
    return {
      ok: false,
      loi: "Be mat khong hop le.",
      jobId: null,
    };
  }

  const soLuong = Number.isFinite(thamSo.soLuong)
    ? Math.max(1, Math.min(20, Math.floor(thamSo.soLuong)))
    : 0;

  if (soLuong <= 0) {
    return {
      ok: false,
      loi: "So luong y tuong phai lon hon 0.",
      jobId: null,
    };
  }

  const repo = createRepo(workspaceId);

  const nguoiDung = await nguoiDungHienTai();

  /*
   * Doc song song nhung gi khong phu thuoc nhau.
   */
  const [hoSo, truCot, chanDung, insight, baiDaDang] = await Promise.all([
    repo.hoSo.lay(),
    repo.truCot.list(),
    repo.chanDung.list(),
    repo.insight.list(),
    repo.contents.list({
      trangThai: "da_dang",
      gioiHan: 30,
    }),
  ]);

  if (!nguoiDung) {
    return {
      ok: false,
      loi: "Khong lay duoc nguoi dung hien tai.",
      jobId: null,
    };
  }

  const sanPham = await repo.sanPham.list();

  const doDayDu = kiemTraDeXuat({
    hoSo,
    truCot,
    chanDung,
    sanPham,
    insight,
  });

  if (!doDayDu.duocPhep) {
    return {
      ok: false,
      loi: doDayDu.lyDo ?? "Ho so chua du dieu kien de de xuat.",
      jobId: null,
    };
  }

  /*
   * Boc cong thuc truoc khi doc trend signals cho model.
   *
   * Ham nay co the doc noi dung bai goc de phan tich,
   * nhung payload de-xuat phia duoi CHI lay congThuc.
   *
   * Noi dung bai follow khong di vao model de xuat.
   */
  await bocCongThucChoBaiMoi(workspaceId, Math.max(20, soLuong * 2));

  const tinHieu = await repo.tinHieuXuHuong.theoNguoiDung(
    nguoiDung,
    Math.max(20, soLuong * 2),
  );

  /*
   * Mot loi goi de xuat chi co TOI DA mot nguon xu huong. Vi vay moi ket qua
   * cua loi goi do co the gan nguon bang ma mot cach xac dinh, khong can (va
   * khong duoc) hoi mo hinh trendSignalId nao da goi y no.
   */
  const nguCanhXuHuong = tinHieu
    .map(taoNguCanhDeXuatTheoXuHuong)
    .find((nguCanh): nguCanh is NguCanhDeXuatTheoXuHuong => nguCanh !== null) ?? null;

  const truCotMucTieu: TruCotMucTieu[] = truCot.map((t: TruCot) => ({
    ten: t.ten,
    tiLeMucTieu: t.tiLeMucTieu,
  }));

  /*
   * Ghim nguon TREN MAY CHU ngay khi day job. ID nay nam o cot rieng cua jobs,
   * khong nam trong du_lieu_vao nen worker/model khong the doc hay sinh lai no.
   */
  const ungVienBanDau: UngVienDeXuat = {
    loai: "studio-de-xuat-v1",
    jobId: randomUUID(),
    trangThai: "dang_cho_ket_qua",
    yTuong: null,
    nguonXuHuong: nguCanhXuHuong?.nguon ?? null,
  };

  const ketQua = await chayNhiemVu({
    nhiemVu: "de-xuat-y-tuong",

    duLieuVao: {
      beMat: thamSo.beMat,

      soLuong,

      tiLeKhamPha: TI_LE_KHAM_PHA,

      hoSo: {
        moTa: hoSo?.moTa ?? null,

        giongDieu: hoSo?.giongDieu ?? null,

        dieuCamKy: hoSo?.dieuCamKy ?? null,
      },

      sanPham: sanPham.map((sp: SanPham) => ({
        ten: sp.ten,
        gia: sp.gia,
        loiIch: sp.loiIch,
        phanDoiThuongGap: sp.phanDoiThuongGap,
        loiKeuGoi: sp.loiKeuGoi,
        lienKet: sp.lienKet,
      })),

      truCot: truCot.map((t: TruCot) => ({
        ten: t.ten,
        mucDich: t.mucDich,
        tiLeMucTieu: t.tiLeMucTieu,
      })),

      chanDung: chanDung.map((c: ChanDung) => ({
        ten: c.ten,
        doTuoi: c.doTuoi,
        ngheNghiep: c.ngheNghiep,
        noiDau: c.noiDau,
        mongMuon: c.mongMuon,
        cauNoiThuongDung: c.cauNoiThuongDung,
      })),

      insight: insight.map((i: Insight) => ({
        noiDung: i.noiDung,
        bangChung: i.bangChung,
        nguon: i.nguon,
      })),

      /*
       * Contents khong co cot `tieuDe`.
       *
       * Chi gui cac truong ma schema contents thuc su co.
       */
      baiDaDang: baiDaDang.map((b) => ({
        beMat: b.beMat,
        gocTiepCan: b.gocTiepCan,
        dangBai: b.dangBai,
      })),

      /*
       * QUAN TRONG:
       *
       * Khong map `noiDung`, ID, URL, ten kenh hay metadata bai vao day.
       * Chi mot cong thuc da boc cua mot nguon da biet o phia may chu duoc gui.
       */
      tinHieuXuHuong: nguCanhXuHuong ? [nguCanhXuHuong.duLieuHoc] : [],

      truCotMucTieu,
    },

    moHinh: "auto",

    khongGianLamViec: workspaceId,

    ungVienDeXuat: ungVienBanDau,
  });

  if (ketQua.trangThai !== "xong" || !ketQua.ketQua) {
    return {
      ok: false,
      loi: ketQua.loi ?? "Khong sinh duoc y tuong.",
      jobId: ketQua.jobId,
    };
  }

  const ungVienDaGhim = await repo.jobs.layUngVienDeXuat(ketQua.jobId);

  if (!laUngVienDeXuat(ungVienDaGhim) || ungVienDaGhim.jobId !== ketQua.jobId) {
    return {
      ok: false,
      loi: "Khong tim thay ung vien de xuat da duoc may chu xac thuc.",
      jobId: ketQua.jobId,
    };
  }

  if (
    (ungVienDaGhim.trangThai === "san_sang_luu" || ungVienDaGhim.trangThai === "da_luu") &&
    ungVienDaGhim.yTuong
  ) {
    return {
      ok: true,
      ketQua: ungVienDaGhim.yTuong,
      jobId: ketQua.jobId,
      moHinh: ketQua.moHinh,
    };
  }

  const yTuong = donKetQuaDeXuat(
    ketQua.ketQua,
    truCot.map((t: TruCot) => t.ten),
    chanDung.map((c: ChanDung) => c.ten),
    thamSo.beMat,
  );

  const yTuongCuoi = raiTheoTruCot(
    ganNguonXuHuong(yTuong, ungVienDaGhim.nguonXuHuong),
    truCotMucTieu,
    soLuong,
  );

  if (yTuongCuoi.length === 0) {
    return {
      ok: false,
      loi: "Mo hinh khong tra ve y tuong hop le.",
      jobId: ketQua.jobId,
    };
  }

  const ungVienSanSang: UngVienDeXuat = {
    ...ungVienDaGhim,
    trangThai: "san_sang_luu",
    yTuong: yTuongCuoi,
  };
  const ungVienDaCapNhat = await repo.jobs.chuyenTrangThaiUngVienDeXuat(
    ketQua.jobId,
    "dang_cho_ket_qua",
    ungVienSanSang,
  );

  if (!ungVienDaCapNhat) {
    const ungVienSauTranhChap = await repo.jobs.layUngVienDeXuat(ketQua.jobId);
    if (
      laUngVienDeXuat(ungVienSauTranhChap) &&
      (ungVienSauTranhChap.trangThai === "san_sang_luu" ||
        ungVienSauTranhChap.trangThai === "da_luu") &&
      ungVienSauTranhChap.yTuong
    ) {
      return {
        ok: true,
        ketQua: ungVienSauTranhChap.yTuong,
        jobId: ketQua.jobId,
        moHinh: ketQua.moHinh,
      };
    }

    return {
      ok: false,
      loi: "Khong the xac nhan ung vien de xuat an toan.",
      jobId: ketQua.jobId,
    };
  }

  return {
    ok: true,
    ketQua: yTuongCuoi,
    jobId: ketQua.jobId,
    moHinh: ketQua.moHinh,
  };
}
