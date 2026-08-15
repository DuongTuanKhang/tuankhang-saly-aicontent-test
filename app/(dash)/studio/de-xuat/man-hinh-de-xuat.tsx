'use client';

import { useState, useTransition } from 'react';

import { Icon } from '../../../sprite-icon';
import { luuYTuongDeXuat, taoDeXuat } from './actions';
import type { BeMat, YTuongDeXuat } from '@/lib/studio/kieu';

const BE_MAT: { ma: BeMat; ten: string }[] = [
  { ma: 'fanpage', ten: 'Fanpage' },
  { ma: 'ho_so_ca_nhan', ten: 'Ho so ca nhan' },
  { ma: 'tiktok', ten: 'TikTok' },
  { ma: 'zalo', ten: 'Zalo' },
];

const SO_LUONG = [5, 10, 15, 20];

export function ManHinhDeXuat() {
  const [beMat, datBeMat] = useState<BeMat>('fanpage');
  const [soLuong, datSoLuong] = useState(10);
  const [yTuong, datYTuong] = useState<YTuongDeXuat[] | null>(null);
  const [jobId, datJobId] = useState<string | null>(null);
  const [moHinh, datMoHinh] = useState<string | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [loiLuu, datLoiLuu] = useState<string | null>(null);
  const [daLuu, datDaLuu] = useState<number | null>(null);
  const [dangChay, batDau] = useTransition();
  const [dangLuu, batDauLuu] = useTransition();

  function deXuat() {
    if (dangChay) return;

    datLoi(null);
    datLoiLuu(null);
    datDaLuu(null);
    datYTuong(null);
    datJobId(null);
    datMoHinh(null);

    batDau(async () => {
      try {
        const ketQua = await taoDeXuat(beMat, soLuong);
        if (!ketQua.ok) {
          datLoi(ketQua.loi);
          return;
        }
        datYTuong(ketQua.ketQua);
        datJobId(ketQua.jobId);
        datMoHinh(ketQua.moHinh);
      } catch {
        datLoi('Khong the de xuat y tuong luc nay. Vui long thu lai sau.');
      }
    });
  }

  function luuYTuong() {
    if (!jobId || dangLuu || dangChay) return;

    datLoiLuu(null);
    datDaLuu(null);

    batDauLuu(async () => {
      try {
        const ketQua = await luuYTuongDeXuat(jobId);
        if (!ketQua.ok) {
          datLoiLuu(ketQua.loi);
          return;
        }
        datDaLuu(ketQua.soYTuong);
      } catch {
        datLoiLuu('Khong the luu y tuong luc nay. Vui long thu lai sau.');
      }
    });
  }

  return (
    <div className="de-xuat">
      <section className="bieu-mau" aria-label="Tuy chon de xuat y tuong">
        <div className="o">
          <span className="o__nhan">Be mat</span>
          <div className="chon-be-mat" role="group" aria-label="Chon be mat">
            {BE_MAT.map((muc) => (
              <button
                className={`btn btn--sm ${beMat === muc.ma ? 'btn--primary' : 'btn--ghost'}`}
                disabled={dangChay}
                key={muc.ma}
                onClick={() => datBeMat(muc.ma)}
                type="button"
              >
                {muc.ten}
              </button>
            ))}
          </div>
        </div>

        <div className="o de-xuat__so-luong">
          <label className="o__nhan" htmlFor="so-luong-de-xuat">
            So luong y tuong
          </label>
          <select
            id="so-luong-de-xuat"
            value={soLuong}
            disabled={dangChay}
            onChange={(event) => datSoLuong(Number(event.target.value))}
          >
            {SO_LUONG.map((so) => (
              <option key={so} value={so}>
                {so} y tuong
              </option>
            ))}
          </select>
        </div>

        <div className="bieu-mau__nut">
          <button className="btn btn--primary" disabled={dangChay} onClick={deXuat} type="button">
            <Icon name="i-sparkle" size={17} />
            {dangChay ? 'Dang de xuat…' : 'De xuat y tuong'}
          </button>
          <span className="ghi-chu-mo-hinh">Y tuong chi de xem truoc, chua duoc luu.</span>
        </div>
      </section>

      {loi ? (
        <div className="chan chan--chan" role="alert">
          <p className="chan__tieu-de">
            <Icon name="i-alert" size={17} />
            Chua the de xuat
          </p>
          <p className="chan__sub">{loi}</p>
        </div>
      ) : null}

      {yTuong ? (
        <KetQuaDeXuat
          yTuong={yTuong}
          moHinh={moHinh}
          coTheLuu={jobId !== null}
          dangLuu={dangLuu}
          daLuu={daLuu}
          loiLuu={loiLuu}
          onLuu={luuYTuong}
        />
      ) : null}
    </div>
  );
}

function KetQuaDeXuat({
  yTuong,
  moHinh,
  coTheLuu,
  dangLuu,
  daLuu,
  loiLuu,
  onLuu,
}: {
  yTuong: YTuongDeXuat[];
  moHinh: string | null;
  coTheLuu: boolean;
  dangLuu: boolean;
  daLuu: number | null;
  loiLuu: string | null;
  onLuu: () => void;
}) {
  return (
    <section className="de-xuat__ket-qua" aria-live="polite" aria-label="Y tuong de xuat">
      <div className="de-xuat__ket-qua-dau">
        <div>
          <h2 className="de-xuat__tieu-de">Y tuong de xuat</h2>
          <p className="ghi-chu-mo-hinh">
            {yTuong.length} y tuong{moHinh ? ` · Mo hinh: ${moHinh}` : ''}
          </p>
        </div>
        <button
          className="btn btn--primary"
          disabled={!coTheLuu || dangLuu || daLuu !== null}
          onClick={onLuu}
          type="button"
        >
          {dangLuu ? 'Dang luu…' : daLuu !== null ? 'Da luu y tuong' : 'Luu y tuong'}
        </button>
      </div>

      {loiLuu ? (
        <p className="de-xuat__trang-thai de-xuat__trang-thai--loi" role="alert">
          {loiLuu}
        </p>
      ) : null}
      {daLuu !== null ? (
        <p className="de-xuat__trang-thai de-xuat__trang-thai--thanh-cong" role="status">
          Da luu {daLuu} y tuong.
        </p>
      ) : null}

      <div className="de-xuat__luoi">
        {yTuong.map((muc, chiSo) => (
          <article className="de-xuat__the" key={`${muc.tieuDe}-${chiSo}`}>
            <div className="de-xuat__the-dau">
              <h3>{muc.tieuDe}</h3>
              {muc.khamPha ? <span className="dau-dat dau-dat--chua">Y tuong kham pha</span> : null}
            </div>
            <dl className="de-xuat__chi-tiet">
              <ThongTin nhan="Tru cot" giaTri={muc.truCot} />
              <ThongTin nhan="Chan dung" giaTri={muc.chanDung} />
              <ThongTin nhan="Goc tiep can" giaTri={muc.gocTiepCan} />
              <ThongTin nhan="Cau mo dau" giaTri={muc.cauMoDau} />
              <ThongTin nhan="Ly do de xuat" giaTri={muc.lyDoDeXuat} />
              <ThongTin nhan="Be mat" giaTri={muc.beMat} />
            </dl>
            <NguonXuHuong nguon={muc.nguonXuHuong} />
          </article>
        ))}
      </div>
    </section>
  );
}

function NguonXuHuong({ nguon }: { nguon: YTuongDeXuat['nguonXuHuong'] }) {
  if (!nguon) return null;

  return (
    <div className="de-xuat__nguon">
      {nguon.tieuDe ? <span>Nguon: {nguon.tieuDe}</span> : null}
      {nguon.tenKenh ? <span>Kenh: {nguon.tenKenh}</span> : null}
      {nguon.lienKet ? (
        <a href={nguon.lienKet} rel="noreferrer" target="_blank">
          Xem nguon
        </a>
      ) : null}
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
