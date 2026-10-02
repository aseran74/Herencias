export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  srcDir: 'src',
  serverDir: 'src/server',
  modules: ['@pinia/nuxt'],
  css: ['~/assets/main.css'],
  app: {
    head: {
      title: 'Cuaderno de partición',
      htmlAttrs: { lang: 'es' },
      meta: [
        {
          name: 'description',
          content:
            'Simulador orientativo de sucesiones en derecho común español, con estirpes, tercios y adjudicación.',
        },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {
    insforgeUrl: process.env.INSFORGE_URL || '',
    insforgeApiKey: process.env.INSFORGE_API_KEY || '',
    public: {
      insforgeUrl: process.env.NUXT_PUBLIC_INSFORGE_URL || process.env.INSFORGE_URL || '',
      insforgeAnonKey: process.env.NUXT_PUBLIC_INSFORGE_ANON_KEY || '',
    },
  },
})
