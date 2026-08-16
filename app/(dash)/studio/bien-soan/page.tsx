import type { Metadata } from 'next';
import Link from 'next/link';

import { Icon } from '../../../sprite-icon';
import { workspaceHienTai } from '@/lib/auth/current-workspace';
import { createRepo } from '@/lib/data-access';
import '../../brand/brand.css';
import '../studio.css';
import { ManHinhBienSoan, type TomTatYTuongBienSoan } from './man-hinh-bien-soan';

export const metadata: Metadata = {
  title: 'Bien soan bai dang — AI Content',
};

export const dynamic = 'force-dynamic';

type ThamSoTrang = { ideaId?: string | string[] };

export default async function TrangBienSoan({
  searchParams,
}: {
  searchParams: Promise<ThamSoTrang>;
}) {
  const { ideaId } = await searchParams;
  const id = typeof ideaId === 'string' ? ideaId : null;

  if (!id) {
    return <TrangKhongCoYTuong />;
  }

  const repo = createRepo(await workspaceHienTai());
  const idea = await repo.yTuong.layTheoId(id);
  if (!idea) {
    return <TrangKhongCoYTuong />;
  }

  const [truCot, chanDung] = await Promise.all([
    idea.pillarId ? repo.truCot.layTheoId(idea.pillarId) : Promise.resolve(null),
    idea.personaId ? repo.chanDung.layTheoId(idea.personaId) : Promise.resolve(null),
  ]);
  const tomTat: TomTatYTuongBienSoan = {
    id: idea.id,
    tieuDe: idea.tieuDe,
    beMat: idea.beMat,
    gocTiepCan: idea.gocTiepCan,
    cauMoDau: idea.cauMoDau,
    lyDoDeXuat: idea.lyDoDeXuat,
    truCot: truCot?.ten ?? null,
    chanDung: chanDung?.ten ?? null,
  };

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">
            <Icon name="i-sparkle" size={13} />
            Studio
          </span>
          <h1 className="page-title">Bien soan bai dang</h1>
          <p className="page-sub">Sinh ban nhap tu y tuong da luu, chinh sua va luu thanh noi dung.</p>
        </div>
      </div>
      <ManHinhBienSoan yTuong={tomTat} />
    </>
  );
}

function TrangKhongCoYTuong() {
  return (
    <section className="chan chan--chan" role="status">
      <p className="chan__tieu-de">
        <Icon name="i-alert" size={17} />
        Khong tim thay y tuong
      </p>
      <p className="chan__sub">Hay mo man bien soan tu mot y tuong da luu trong Studio.</p>
      <Link className="btn btn--primary btn--sm" href="/studio/de-xuat">
        <Icon name="i-sparkle" size={16} />
        De xuat y tuong
      </Link>
    </section>
  );
}
