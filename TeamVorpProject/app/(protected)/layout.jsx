import RequireAuth from "../components/RequireAuth/RequireAuth";

export default function ProtectedLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}