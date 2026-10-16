import "bootstrap/dist/css/bootstrap.min.css";
import "../globals.css";
import RequireAuth from "../components/RequireAuth/RequireAuth";

export default function ProtectedLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}