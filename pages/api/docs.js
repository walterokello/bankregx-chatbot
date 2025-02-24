import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { createRouter } from "next-connect";

const swaggerDocument = YAML.load(path.join(process.cwd(), "swagger.yaml"));

const router = createRouter();

router.use(swaggerUi.serve);
router.get(swaggerUi.setup(swaggerDocument));

export default router.handler();
