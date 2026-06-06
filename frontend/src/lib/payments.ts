/** Open Telegram Stars invoice (native payment sheet, not a web page). */
export function openTelegramInvoice(invoiceUrl: string): Promise<'paid' | 'cancelled' | 'failed' | 'pending'> {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    return Promise.reject(new Error('Open the shop inside Telegram Mini App'));
  }

  if (!invoiceUrl || !invoiceUrl.includes('t.me/')) {
    return Promise.reject(new Error('Invalid invoice link from server'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (status: 'paid' | 'cancelled' | 'failed' | 'pending') => {
      if (settled) return;
      settled = true;
      tg.offEvent?.('invoiceClosed', onInvoiceClosed);
      resolve(status);
    };

    const onInvoiceClosed = (event: { status?: string }) => {
      const s = event?.status;
      if (s === 'paid') finish('paid');
      else if (s === 'failed') finish('failed');
      else if (s === 'pending') finish('pending');
      else finish('cancelled');
    };

    if (typeof tg.onEvent === 'function') {
      tg.onEvent('invoiceClosed', onInvoiceClosed);
    }

    if (typeof tg.openInvoice !== 'function') {
      reject(new Error('Telegram payments not supported in this client. Update Telegram.'));
      return;
    }

    try {
      tg.openInvoice(invoiceUrl, (status: string) => {
        if (status === 'paid') finish('paid');
        else if (status === 'failed') finish('failed');
        else if (status === 'pending') finish('pending');
        else finish('cancelled');
      });
    } catch (e) {
      if (!settled) {
        settled = true;
        reject(e);
      }
    }
  });
}
