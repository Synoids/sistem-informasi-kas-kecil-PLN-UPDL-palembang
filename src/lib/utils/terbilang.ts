export function terbilangRupiah(angka: number): string {
  if (angka === 0) return 'Nol Rupiah'
  
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ]

  let hasil = ''
  
  // To handle negative numbers, though typically we don't have negative realization
  const isNegative = angka < 0
  angka = Math.abs(angka)

  if (angka < 12) {
    hasil = bilangan[angka]
  } else if (angka < 20) {
    hasil = terbilangRupiah(angka - 10).replace(' Rupiah', '') + ' Belas'
  } else if (angka < 100) {
    hasil = terbilangRupiah(Math.floor(angka / 10)).replace(' Rupiah', '') + ' Puluh ' + bilangan[angka % 10]
  } else if (angka < 200) {
    hasil = 'Seratus ' + terbilangRupiah(angka - 100).replace(' Rupiah', '')
  } else if (angka < 1000) {
    hasil = terbilangRupiah(Math.floor(angka / 100)).replace(' Rupiah', '') + ' Ratus ' + terbilangRupiah(angka % 100).replace(' Rupiah', '')
  } else if (angka < 2000) {
    hasil = 'Seribu ' + terbilangRupiah(angka - 1000).replace(' Rupiah', '')
  } else if (angka < 1000000) {
    hasil = terbilangRupiah(Math.floor(angka / 1000)).replace(' Rupiah', '') + ' Ribu ' + terbilangRupiah(angka % 1000).replace(' Rupiah', '')
  } else if (angka < 1000000000) {
    hasil = terbilangRupiah(Math.floor(angka / 1000000)).replace(' Rupiah', '') + ' Juta ' + terbilangRupiah(angka % 1000000).replace(' Rupiah', '')
  } else if (angka < 1000000000000) {
    hasil = terbilangRupiah(Math.floor(angka / 1000000000)).replace(' Rupiah', '') + ' Miliar ' + terbilangRupiah(angka % 1000000000).replace(' Rupiah', '')
  } else if (angka < 1000000000000000) {
    hasil = terbilangRupiah(Math.floor(angka / 1000000000000)).replace(' Rupiah', '') + ' Triliun ' + terbilangRupiah(angka % 1000000000000).replace(' Rupiah', '')
  }

  hasil = hasil.trim().replace(/\s+/g, ' ')
  
  // Base case logic doesn't append 'Rupiah', so we append it at the very end of the top-level call.
  // Wait, the recursive calls remove ' Rupiah', but we don't append it in the logic above. 
  // Let's refactor the base function to just return the words, and wrap it.
  return hasil
}

export function generateTerbilang(angka: number): string {
  if (angka === 0) return 'Nol Rupiah'
  const isNegative = angka < 0
  const absVal = Math.abs(angka)
  const terbilang = terbilangRupiah(absVal)
  return `${isNegative ? 'Minus ' : ''}${terbilang} Rupiah`
}
