'use client';

import { useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { luuNoiDung, sinhNoiDung } from './actions';
import type { BeMat } from '@/lib/studio/kieu';

export type TomTatYTuongBienSoan = {
  id: string;
  tieuDe: string | null;
  beMat: BeMat;
  gocTiepCan: string | null;
  cauMoDau: string | null;
  lyDoDeXuat: string | null;
  truCot: string | null;
  chanDung: string | null;
};

export function ManHinhBienSoan({ yTuong }: { yTuong: TomTatYTuongBienSoan }) {
  const [tieuDe, datTieuDe] = useState(yTuong.tieuDe ?? '');
  const [noiDung, datNoiDung] = useState('');
  const [moHinh, datMoHinh] = useState<string | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [daLuu, datDaLuu] = useState(false);
  const [dangSinh, batDauSinh] = useTransition();
  const [dangLuu, batDauLuu] = useTransition();

  function sinhBai() {
    if (dangSinh || dangLuu) return;
    datLoi(null);
    datDaLuu(false);

    batDauSinh(async () => {
      try {
        const ketQua = await sinhNoiDung(yTuong.id);
        if (!ketQua.ok) {
          datLoi(ketQua.loi);
          return;
        }
        datTieuDe(ketQua.ketQua.tieuDe);
        datNoiDung(ketQua.ketQua.noiDung);
        datMoHinh(ketQua.moHinh);
      } catch {
        datLoi('Khong the sinh noi dung luc nay. Vui long thu lai sau.');
      }
    });
  }

  function luuBai() {
    if (dangSinh || dangLuu || noiDung.trim() === '') return;
    datLoi(null);
    datDaLuu(false);

    batDauLuu(async () => {
      try {
        const ketQua = await luuNoiDung(yTuong.id, noiDung);
        if (!ketQua.ok) {
          datLoi(ketQua.loi);
          return;
        }
        datDaLuu(true);
      } catch {
        datLoi('Khong the luu noi dung luc nay. Vui long thu lai sau.');
      }
    });
  }

  return (
    <div className="bien-soan">
      <section className="de-xuat__the" aria-label="Y tuong nguon">
        <div className="de-xuat__the-dau">
          <h2 className="de-xuat__tieu-de">{yTuong.tieuDe ?? 'Y tuong chua co tieu de'}</h2>
          <span className="dau-dat">{yTuong.beMat}</span>
        </div>
        <dl className="de-xuat__chi-tiet">
          <ThongTin nhan="Tru cot" giaTri={yTuong.truCot} />
          <ThongTin nhan="Chan dung" giaTri={yTuong.chanDung} />
          <ThongTin nhan="Goc tiep can" giaTri={yTuong.gocTiepCan} />
          <ThongTin nhan="Cau mo dau" giaTri={yTuong.cauMoDau} />
          <ThongTin nhan="Ly do de xuat" giaTri={yTuong.lyDoDeXuat} />
        </dl>
      </section>

      <section className="bieu-mau" aria-label="Bien soan bai dang">
        <div className="bieu-mau__nut">
          <button className="btn btn--primary" disabled={dangSinh || dangLuu} onClick={sinhBai} type="button">
            <Icon name="i-sparkle" size={17} />
            {dangSinh ? 'Dang sinh bai…' : 'Sinh noi dung'}
          </button>
          {moHinh ? <span className="ghi-chu-mo-hinh">Mo hinh: {moHinh}</span> : null}
        </div>

        <div className="o">
          <label className="o__nhan" htmlFor="tieu-de-bien-soan">Tieu de</label>
          <input
            id="tieu-de-bien-soan"
            onChange={(event) => datTieuDe(event.target.value)}
            placeholder="Tieu de ban nhap"
            type="text"
            value={tieuDe}
          />
          <span className="ghi-chu-mo-hinh">Tieu de la ban nhap tren man hinh va chua duoc luu o Moc 2.</span>
        </div>

        <div className="o soan">
          <label className="o__nhan" htmlFor="noi-dung-bien-soan">Noi dung bai dang</label>
          <textarea
            className="soan__o"
            id="noi-dung-bien-soan"
            onChange={(event) => datNoiDung(event.target.value)}
            placeholder="Sinh noi dung hoac viet ban nhap cua ban."
            value={noiDung}
          />
        </div>

        <div className="bieu-mau__nut">
          <button
            className="btn btn--primary"
            disabled={dangSinh || dangLuu || noiDung.trim() === ''}
            onClick={luuBai}
            type="button"
          >
            {dangLuu ? 'Dang luu…' : daLuu ? 'Da luu noi dung' : 'Luu noi dung'}
          </button>
        </div>

        {loi ? <p className="de-xuat__trang-thai de-xuat__trang-thai--loi" role="alert">{loi}</p> : null}
        {daLuu ? (
          <p className="de-xuat__trang-thai de-xuat__trang-thai--thanh-cong" role="status">
            Da luu noi dung tu y tuong nay.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function ThongTin({ nhan, giaTri }: { nhan: string; giaTri: string | null }) {
  return (
    <div>
      <dt>{nhan}</dt>
      <dd>{giaTri ?? 'Chua xac dinh'}</dd>
    </div>
  );
}
