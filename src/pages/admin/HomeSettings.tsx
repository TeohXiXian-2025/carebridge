import { Link } from 'react-router-dom';
import { HomeForm } from '../../components/HomeForm';
import { AccountSettings } from '../../components/AccountSettings';
import { ManagersPanel } from '../../components/ManagersPanel';
import { useToast } from '../../components/ui';
import { api } from '../../lib/api';
import type { Home } from '../../lib/types';
import { HomeAdminPage, PageHeader } from './AdminShell';

/** Home profile settings: photo, description, address, drop-off hours. */
function Settings({ home }: { home: Home }) {
  const toast = useToast();
  return (
    <>
      <PageHeader title="Home profile" sub="Donors see this on your public page." right={<Link to={`/homes/${home.id}`} className="link nowrap">Public page →</Link>} />
      <div style={{ maxWidth: 640 }}><ManagersPanel home={home} /></div>
      <div style={{ maxWidth: 640 }}><AccountSettings logout /></div>
      <h3>Home details</h3>
      <div className="card" style={{ maxWidth: 640, padding: 20 }}>
        <HomeForm
          initial={home}
          submitLabel="Save changes"
          onSubmit={async (v) => {
            await api.updateHome(home.id, v);
            toast('Profile saved');
          }}
        />
      </div>
    </>
  );
}

export default function HomeSettingsPage() {
  return <HomeAdminPage>{(home) => <Settings home={home} />}</HomeAdminPage>;
}
