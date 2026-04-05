import { RequestHandler } from 'express';
import { NoticesService } from './notices.service';

export class NoticesViewController {
  constructor(private noticesService: NoticesService) {}

  index: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const result = await this.noticesService.findAll({}, { page: 1, pageSize: 20 });
      res.render('pages/notices/index', {
        title: 'Avisos',
        notices: result.data,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  };

  show: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const id = String(req.params.id);
      const notice = await this.noticesService.findNoticeById(id);
      res.render('pages/notices/show', { title: notice.title, notice });
    } catch (err) {
      next(err);
    }
  };

  create: RequestHandler = async (_req, res, next): Promise<void> => {
    try {
      res.render('pages/notices/form', { title: 'Crear aviso', notice: null, errors: [] });
    } catch (err) {
      next(err);
    }
  };

  store: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      await this.noticesService.createNotice(req.body, req.context);
      res.redirect('/notices');
    } catch (err) {
      next(err);
    }
  };

  edit: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const id = String(req.params.id);
      const notice = await this.noticesService.findNoticeById(id);
      res.render('pages/notices/form', { title: 'Editar aviso', notice, errors: [] });
    } catch (err) {
      next(err);
    }
  };

  update: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const id = String(req.params.id);
      await this.noticesService.updateNotice(id, req.body, req.context);
      res.redirect('/notices');
    } catch (err) {
      next(err);
    }
  };

  destroy: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const id = String(req.params.id);
      await this.noticesService.deleteNotice(id, req.context);
      res.redirect('/notices');
    } catch (err) {
      next(err);
    }
  };
}
