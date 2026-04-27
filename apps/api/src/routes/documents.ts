import { Router } from 'express';
import {
  listDocuments,
  createDocument,
  getDocument,
  replaceDocument,
  patchFields,
  patchMeta,
  deleteDocument,
  exportPdf,
} from '../controllers/documentController.js';

const router = Router();

router.get('/', listDocuments);
router.post('/', createDocument);
router.get('/:id', getDocument);
router.put('/:id', replaceDocument);
router.patch('/:id/fields', patchFields);
router.patch('/:id/meta', patchMeta);
router.delete('/:id', deleteDocument);
router.get('/:id/pdf', exportPdf);

export default router;
