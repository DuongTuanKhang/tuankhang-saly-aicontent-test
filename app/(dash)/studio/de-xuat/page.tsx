import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { ManHinhDeXuat } from './man-hinh-de-xuat';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { kiemTraDeXuat } from '@/lib/brand/do-day-du';
import { createRepo } from '@/lib/data-access';
import type { Idea } from '@/lib/data-access/ideas';
import '../../brand/brand.css';
import '../studio.css';

export const metadata: Metadata = {
  title: 'De xuat y tuong — AI Content',
};

export const dynamic = 'force-dynamic';

export default async function TrangDeXuat() {
  const repo = createRepo(await workspaceHienTai());
  const [hoSo, truCot, chanDung, sanPham, insight, yTuongDaLuu] = await Promise.all([
    repo.hoSo.lay(),
    repo.truCot.list(),
    repo.chanDung.list(),
    repo.sanPham.list(),
    repo.insight.list(),
    repo.yTuong.list(),
  ]);
  const doDayDu = kiemTraDeXuat({ hoSo, truCot, chanDung, sanPham, insight });

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-sparkle" size={13} />
            Studio
          </span>
          <h1 className="page-title">De xuat y tuong</h1>
          <p className="page-sub">
            Tao y tuong dua tren ho so thuong hieu, noi dung da dang va nhung cong thuc xu huong da duoc boc tach.
          </p>
        </div>
      </div>

      {!doDayDu.duocPhep ? (
        <section className="chan chan--chan" role="status">
          <p className="chan__tieu-de">
            <Icon name="i-alert" size={17} />
            May de xuat dang bi chan
          </p>
          <p className="chan__sub">{doDayDu.lyDo}</p>
          <Link className="btn btn--primary btn--sm" href="/brand">
            <Icon name="i-layers" size={16} />
            Hoan thien ho so thuong hieu
          </Link>
        </section>
      ) : (
        <ManHinhDeXuat />
      )}
      <DanhSachYTuongDaLuu yTuong={yTuongDaLuu} />
    </>
  );
}

function DanhSachYTuongDaLuu({
  yTuong,
}: {
  yTuong: Idea[];
}) {
  if (yTuong.length === 0) return null;

  return (
    <section className="de-xuat__ket-qua" aria-label="Y tuong da luu">
      <div>
        <h2 className="de-xuat__tieu-de">Y tuong da luu</h2>
        <p className="ghi-chu-mo-hinh">Chon mot y tuong de sinh va bien soan bai dang.</p>
      </div>
      <div className="de-xuat__luoi">
        {yTuong.map((muc) => (
          <article className="de-xuat__the" key={muc.id}>
            <div className="de-xuat__the-dau">
              <h3>{muc.tieuDe ?? 'Y tuong chua co tieu de'}</h3>
              {muc.khamPha ? <span className="dau-dat dau-dat--chua">Y tuong kham pha</span> : null}
            </div>
            <dl className="de-xuat__chi-tiet">
              <ThongTin nhan="Goc tiep can" giaTri={muc.gocTiepCan} />
              <ThongTin nhan="Cau mo dau" giaTri={muc.cauMoDau} />
              <ThongTin nhan="Be mat" giaTri={muc.beMat} />
            </dl>
            <Link className="btn btn--primary btn--sm" href={`/studio/bien-soan?ideaId=${muc.id}`}>
              <Icon name="i-sparkle" size={16} />
              Bien soan
            </Link>
          </article>
        ))}
      </div>
    </section>
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
