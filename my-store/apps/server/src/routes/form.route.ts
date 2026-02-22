import { Router } from "express";
import * as formController from "../controllers/form.controller";

const router = Router();

router.get("/:formId/fields", formController.getFormFields);

export default router;
