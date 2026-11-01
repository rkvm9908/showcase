import Project from "../models/Project.js";
import makeCrud from "./crud.js";

export default makeCrud(Project, "projects", ["title", "category", "description", "tech", "link"]);