declare module "vitest" {
    export interface ProvidedContext {
      MONGO_URI: string;
    }
  }
  
  export {};