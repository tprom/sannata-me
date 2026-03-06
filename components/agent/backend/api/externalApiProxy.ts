export async function externalApiProxy(_payload: Record<string, unknown>) {
  // Заглушка для внешних API вызовов
  return {
    status: "stubbed",
    data: null,
  };
}
