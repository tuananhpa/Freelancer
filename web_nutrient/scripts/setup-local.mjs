import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
} from "node:fs";
import webpush from "web-push";
if (existsSync(".dev.vars")) {
  if (!readFileSync(".dev.vars", "utf8").includes("JOB_TOKEN="))
    appendFileSync(
      ".dev.vars",
      '\nJOB_TOKEN="' + randomBytes(32).toString("hex") + '"\n',
    );
  console.log("Cấu hình local đã tồn tại, giữ nguyên.");
  process.exit(0);
}
mkdirSync(".local", { recursive: true });
const password = randomBytes(18).toString("base64url");
const vapid = webpush.generateVAPIDKeys();
writeFileSync(
  ".dev.vars",
  'ENCRYPTION_KEY="' +
    randomBytes(32).toString("base64") +
    '"\nADMIN_USERNAME="nutri-admin"\nADMIN_PASSWORD="' +
    password +
    '"\nVAPID_PUBLIC_KEY="' +
    vapid.publicKey +
    '"\nVAPID_PRIVATE_KEY="' +
    vapid.privateKey +
    '"\nVAPID_SUBJECT="mailto:admin@example.com"\n',
);
writeFileSync(
  ".local/admin-access.txt",
  "Trang quản trị: /admin\nTài khoản: nutri-admin\nMật khẩu: " +
    password +
    "\nChỉ chia sẻ link công khai, không chia sẻ file này.\n",
);
appendFileSync(
  ".dev.vars",
  'JOB_TOKEN="' + randomBytes(32).toString("hex") + '"\n',
);
console.log(
  "Đã tạo secret local và .local/admin-access.txt. Không in mật khẩu ra log.",
);
