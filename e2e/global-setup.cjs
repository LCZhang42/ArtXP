module.exports = async function globalSetup() {
  const { createServer } = await import('vite');
  const baseUrl = new URL(
    process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
  );
  const server = await createServer({
    server: {
      host: baseUrl.hostname,
      port: Number(baseUrl.port || 80),
      strictPort: true,
    },
  });

  await server.listen();

  return async () => {
    await server.close();
  };
};
