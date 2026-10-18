export async function onRequest(context) {
  const country = context.request.cf?.country || 'XX';
  const response = await context.next();
  const newResponse = new Response(response.body, response);
  newResponse.headers.append(
    'Set-Cookie',
    `cf_country=${country}; Path=/; SameSite=Lax; Max-Age=86400`
  );
  return newResponse;
}
