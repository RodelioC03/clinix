import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";
const host = process.env.HOSTNAME || "0.0.0.0";
const nextBin = "./node_modules/next/dist/bin/next";

const child = spawn(process.execPath, [nextBin, "start", "-H", host, "-p", port], {
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
