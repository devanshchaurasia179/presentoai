import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve templates directory relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "templates");

/**
 * Render an EJS mail template by name.
 *
 * @param template  Filename without extension, e.g. "otp-verification"
 * @param data      Variables passed to the template
 * @returns         Rendered HTML string
 */
export async function renderMailTemplate(
  template: string,
  data: Record<string, unknown>
): Promise<string> {
  const filePath = path.join(TEMPLATES_DIR, `${template}.ejs`);
  return ejs.renderFile(filePath, data, { async: true });
}
