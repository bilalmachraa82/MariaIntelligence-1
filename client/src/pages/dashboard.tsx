import NewModernDashboard from "@/components/dashboard/new-modern-dashboard";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <NewModernDashboard />
    </motion.div>
  );
}
