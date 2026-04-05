import { AuditRepository } from './shared/repositories/audit.repository';
import { NoticesRepository } from './modules/notices/notices.repository';
import { NoticesService } from './modules/notices/notices.service';
import { AuthRepository } from './modules/auth/auth.repository';
import { AuthService } from './modules/auth/auth.service';
import { UserLoginAuditRepository } from './modules/users/user-login-audit.repository';

const auditRepository = new AuditRepository();
const loginAuditRepository = new UserLoginAuditRepository();
const authRepository = new AuthRepository();

export const container = {
  auditRepository,
  loginAuditRepository,
  authRepository,
  authService: new AuthService(authRepository, loginAuditRepository),
  noticesRepository: new NoticesRepository(),
  noticesService: new NoticesService(new NoticesRepository(), auditRepository),
};
