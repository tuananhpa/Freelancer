// Dev-only: chạy giao diện cũ khi chưa có backend. `npx vite --config vite.mock.config.ts`
// shortcut: mọi API trả dữ liệu rỗng, chỉ đăng nhập là thật — bỏ file này khi backend chạy được.
import { defineConfig, mergeConfig, type Plugin } from 'vite';
import base from './vite.config';
import accounts from './mock/demo-accounts.json';

const ok = (data: unknown) => JSON.stringify({ status: 200, message: 'OK', data });

const readBody = (req: any): Promise<any> =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (c: Buffer) => (raw += c));
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
  });

const publicUser = ({ password, ...u }: (typeof accounts)[number]) =>
  ({ avatarUrl: null, status: 'ACTIVE', authProvider: 'LOCAL', ...u });

const userFromToken = (auth?: string) =>
  accounts.find((a) => auth === `Bearer mock-${a.id}`);

const mockApi = (): Plugin => ({
  name: 'mock-api',
  configureServer(server) {
    server.middlewares.use('/api', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const url = (req.url || '').split('?')[0];

      if (url === '/auth/login' && req.method === 'POST') {
        const b = await readBody(req);
        const a = accounts.find((x) => (x.email === b.email || (x as any).studentCode === b.studentCode) && x.password === b.password);
        if (!a) { res.statusCode = 400; return res.end(JSON.stringify({ status: 400, errorCode: 'BAD_CREDENTIALS', message: 'Sai tài khoản hoặc mật khẩu (xem mock/demo-accounts.json)' })); }
        return res.end(ok({ accessToken: `mock-${a.id}`, user: publicUser(a) }));
      }

      const me = userFromToken(req.headers.authorization);
      if (!me) { res.statusCode = 401; return res.end(JSON.stringify({ status: 401, message: 'Chưa đăng nhập' })); }
      if (url === '/users/me') return res.end(JSON.stringify(publicUser(me)));

      // Mọi endpoint khác: GET trả danh sách rỗng, ghi trả object rỗng
      return res.end(ok(req.method === 'GET' ? [] : {}));
    });
  },
});

// Plugin middleware chạy trước proxy /api của vite.config nên không cần gỡ proxy
export default mergeConfig(base, defineConfig({ plugins: [mockApi()] }));
