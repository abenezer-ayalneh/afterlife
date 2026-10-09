/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />
declare namespace App {
  interface Locals { owner:string; admin?:string; }
}
