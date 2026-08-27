import { BoltIcon, BuildingOffice2Icon, MapIcon, QuestionMarkCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CategoryIcon({ category, className = 'h-5 w-5' }) {
  const icons = { pothole: MapIcon, streetlight: BoltIcon, trash: TrashIcon, graffiti: BuildingOffice2Icon, water_leak: WaterIcon, other: QuestionMarkCircleIcon };
  const Icon = icons[category] || QuestionMarkCircleIcon;
  return <Icon className={className} />;
}

function WaterIcon({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true"><path d="M12 3s6 6.6 6 11a6 6 0 1 1-12 0c0-4.4 6-11 6-11Z"/><path d="M9.5 15.5c.6 1.2 1.5 1.8 2.8 1.8"/></svg>;
}
