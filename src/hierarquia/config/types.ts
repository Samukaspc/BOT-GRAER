import { ROLES } from "./index";

export type ChaveCargoGraer = keyof typeof ROLES;

export type IdCargoGraer = (typeof ROLES)[ChaveCargoGraer];
