import Certificate from "../models/Certificate.js";
import makeCrud from "./crud.js";

export default makeCrud(Certificate, "certificates", ["title", "category", "issuer", "date", "description"]);