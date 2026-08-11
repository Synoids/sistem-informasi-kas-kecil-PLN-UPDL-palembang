export type AppError = {
  code: string;
  message: string;
};

export function handleRpcError(error: any): AppError {
  if (!error) return { code: 'UNKNOWN_ERROR', message: 'Terjadi kesalahan yang tidak diketahui.' };

  const message = error.message || '';

  if (message.includes('ERR_INSUFFICIENT_FUNDS')) {
    return {
      code: 'ERR_INSUFFICIENT_FUNDS',
      message: 'Saldo sumber dana tidak mencukupi untuk melakukan transaksi ini.',
    };
  }

  if (message.includes('ERR_UNAUTHORIZED_SOURCE')) {
    return {
      code: 'ERR_UNAUTHORIZED_SOURCE',
      message: 'Anda tidak memiliki hak akses pada sumber dana ini.',
    };
  }

  if (message.includes('ERR_INVALID_INPUT')) {
    return {
      code: 'ERR_INVALID_INPUT',
      message: 'Input tidak valid. Pastikan nominal lebih dari 0.',
    };
  }

  if (message.includes('ERR_NOT_FOUND')) {
    return {
      code: 'ERR_NOT_FOUND',
      message: 'Data (sumber dana atau transaksi) tidak ditemukan.',
    };
  }

  if (message.includes('ERR_SAME_SOURCE_DEST')) {
    return {
      code: 'ERR_SAME_SOURCE_DEST',
      message: 'Sumber dana asal dan tujuan tidak boleh sama.',
    };
  }

  if (message.includes('ERR_UNAUTHORIZED')) {
    return {
      code: 'ERR_UNAUTHORIZED',
      message: 'Akses ditolak. Anda tidak memiliki otoritas untuk operasi ini.',
    };
  }

  // Fallback
  return {
    code: error.code || 'DB_ERROR',
    message: message || 'Terjadi kesalahan pada database.',
  };
}
