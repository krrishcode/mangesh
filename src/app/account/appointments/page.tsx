import { AppointmentsView } from '@/react/user/components/views/AppointmentsView';

export const metadata = {
  title: 'Appointments | Mangesh Mahadev',
  robots: { index: false, follow: false },
};

export default function AccountAppointmentsRoute() {
  return <AppointmentsView />;
}
