import { jsPDF } from 'jspdf';

// Logo oficial da Maria Faz em base64
const LOGO_MF_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAh1BMVEX///8AAADz8/P7+/v39/ft7e3w8PD09PTn5+fg4ODd3d3j4+Pr6+vNzc3JycnW1tadnZ3BwcGwsLCkpKSAgICZmZltbW09PT0uLi6np6dJSUlXV1e3t7eLi4tgYGBERERQUFCHh4czMzNlZWV1dXUmJiYZGRkcHBwQEBA5OTlxcXEsLCwWFhbqkgEkAAAQPklEQVR4nO1daXeqShCNEtSooHGOGnGKOsT8/9/3wEyv7qoGXC7v+uT00+tFdlbX3FXdPT095KEPc3f+2nJ2M2s8u5ZSR6PcbC/GbwvXeW1NrfHTkjbG1JrdD1c/cA7X2a+zjNGoXXx+nxwfxnNm7nRmH84/5q8vz5m1ks5mNlscvse3yWg8sYOYTCfj2/j7sJitkuqsJaDl70+32cid5P5iuFbuzB1Nbrfjec/L3cekNHstdpcddzpJwmaNpv8/iU67Wdw+YzS7dWdp6axW7nr8spzlZVuC/MufuY8fh/PMCmEzGUWbef90vp/np59YRb8ebi4v+9NofhuPyja1OPPptDjzdtY6ZeQXUVjh9nw/vHyd/36MF69va2s6m/VMa+rOel6rZVqz6avVWsymy+9Vzxu+Lr73w+v55cMJJbeHp3x/eCuOvx8r/H1Pw/f75fD1+vX73fuevnmWZz05ZmvxvFz/fu/vl78fB8aKHdpJ/u3H0hQzTtF0fjicPxlaPvRTwLTPj3fGbgmRwt9+2p6VIcA82BymDDv1ofl2vTFgSxBgv3PYOBJz1DydGKLjkNO+PnD5FdDzF+YH+OjfLi6/Anq7HZ/fPdeRDZcIhx+u/4Qwo2f+Yk7OzoHLz8fswDS5/LfDiEGPeZ9HcxZ1gCa/W+L+E7L72XA5FtDn0sxlRzb0QC6DDtndmTfqL2TofTMoHrNfvh4eBegxDW5nI0NLH+S+YcBuybTijxEamG5PVo9wOGbJYjMCpK1Z/e1uBhmST/1obFD0MXwxrX/WNSS0p+l5o8Hsw7BFMr1vljYifKVvMYbNvslcNk0bA+ZfZgwRi1vdQx7RNe5wylNGgxF1RtM+JJnXR4Y4ZTB8p26Gf6cyzJl31wxZtvD4N5rJB50lKSP820/wePpMrumfaIbHJxqGe1pK29QdPBYvNC2AaZ2OIkCLNkE8k8v6Z8xQhHPyJt65eAwZirO+9H1IJ7B/2pZG8ETdwtSQIWlLnxMzrAD51pKLx6INw9EjgZ9gzHBI3UK3g1QFLW4gHkuanD+lZCig3a0RQ9KeNtm8/RfQ/lEyJG/h2Izhi7EtrR6LJrMWlFtaxHA2J+8gLUMH2lJDO0q5pcw7SUJQDCjzOu5AuaWMG44DQ9FKP8mVVULa/bM2w6VxWE+8ufpmaDkMtA7jxnXJNzrJy7BGqFcIw6YZYjdBkpfhUr2oShhq3HIAXXcSxPAW/FmdwPP14L8HWcnQeGkAMlSjbCE8eU9rkrD0QcMZwZBSkSCGTUZJNUCZVTH8Zn7Y+MWjMqtiiIdKPzgqw5q+NGBIRUnh1+bT9Ggq8YAYUp4+OD5sN9r4oXBzFYb6kfYX+B5UPQKGZFgPu1/kYMkZejp3iR0tOQT8Tg7C1I7+kQcJEMTCBDVWvfDSfGO3pYPCvnK5JrQnrjUhaPCJCSN5Kd89KUMcU4fZRUImNxcwCIhcXTlNIvlRGRoEQH5Af+8v8IQgRDCk0otI9LNJ10gOEg7UMcQ3oXAscA22Z0L+gJ5b/DlRR6uQJ4gu8ZTfJ9WXVjA0TkCgJJCCITgVcgFVDLEvRTDEXWLPGBL0LTzXBuJdXsm6DNGYiFDIQzgROgzRx5TPcxjn24hOC32YDsEQjU5KzOAl9AlC+FZKIPrSMzNYxcM9I4YgJ5JKLbO9YYh68oQaIg8lDM0DGdA3lJMwIm/zRccQ3XoZUAwpGlmFoUL+RAUilCb6UoLhHfwZD0TBEIWEkOXkGcEQ4zRKHYGiMD1Gko1jbRQ9xd6UYPgM/2w+aGOwMiM3XAPWzDgFzH4jVnF+gIYhaiVCb2kYvkaPeijY0jBeGlwO2tI6DDENJNJlkInjMXyt4jmDXbMShrIhitBKNSo5w/Cq3mGJJl9mfbEwRUj0qvRgFUMswHIXBGxpOlsK07rkBZVBmTKGlw+GzBGvs6XoyKhlOBimDDFA3hgypGxp+FcfmuEzRLsKWwomZSVDyJjkz/UYEmF9dXwp3FKGIFEvTN2GDCGORxaYmCGmpBLY0jcQr1UM0cGTE9gwVgqLuQI09u9kDOHmKu/tMYz54xhDw4xixNCsyFAbpw1OgBHD4IzTXKl3TsYQ34E82yXTuMoYQoVXwlbHDDVxGnCGFjpTIRk4xesMSC/BQU5xoqGxmDOE9ErO8Bhe1a+wBPH0o2KI6S3ZKYRyKxi64c98hriVJDYX4AJCJ0bGMDzBJDVDCJ7kDFHlqzLEfAjz5PsihvDIbB1DXIxJ0xANTYKG4EtJhlj2lTAMT4Xhpqpq/fYRU/fZp5KhhOETrEOa0jOEaDGxrgAnEcXQIZBJU4K7IhiiL80+o9XQdQw3IRHVcbrqMdJoC8bUDLG6KinDPxjSb0Xmw3AW4cAQK1DMM/pSo+nQa0hFvRCehOEkPAHm+PGBIZQGLJcEwzT5UhjQSBliLWTpS6EGhGBIeAJQWiVDS9bGUTLEOVqZoofUJJy9KxhiokOytsVBCdxUCUPoEMIwRtCyMYZQnGQTnM4wOUNsQJf0Qz7MDLChkmLm+tJyhpBIeqpkCG4ewRCtV/YduVH61GFoi3dK2dLgVKgY4jqoXL2B+BLShDwkZ4iVrZJhWKCjRLCrGEI5lTPMKGcIvt44dQR5vaxEFYZQ+lAznKBRhkdxCiJfKvOl6EuzYngGj2yxrgjGWAo2VMIQXTMkdyVvBtVSxDK/ohqw8AVFXLK8D+ZLS4a2YCjpS5jWjRiiqQ6Qx0L3SpSgRD1sDwzhgn8YwpK+vB5qGELZE7ShcB+CITYD7Lfml34TDCEcIPjAEKyj5I07ylXAmIRk+Ae+5JGSIZSnCMKgW3DfigzSExAOHYZQgAIJQ/Dzkmt4hBIl5qnTGxhKFlTwJDpaxXw4xSywnCF0wf3KRRswhJqKJIYGGYYMwSQVR4chWJjSYIeHIRliwhBcHcuHQqpYZvQ+0ZF68Ew+hpgCbISRMwSXJ4ExV9YVGQwxI1BuAsHKb5+hxZ5pmH1FX/qKDGUbXyHp9mhVKEYQDJ1MBQzB+QvOEIoKYUvvEyVTYO+hjiFY+pjpCcRpZAzB6cWO4RAK5eUMsTKPDLG2ixmCY1acUJkyDAPHRzEE5cBgDEMQwp4rwRDcV8QQ61qCIZr8kuE7JnElDDHRqmQIHQmT4ZEP/hU/GQwxnMeaELyeYEtLMYTgQsxTvOp5AEPMl0YMfZuJfWYxwyV4T8EQLUx5At/TgSHMafNS9Zgh2D4Vw3VZiZDJWZQP3+HXMYYYUwuGMGs0Ul5RtaYrgUoYvrp4WN5HMsRMEiO/6AMNw59CcV0/hNwQzlCaTXa5JEPQ6IhngiHGtYIhBkUxQ0gZShhiGlLKEAuWrJEoxnAFboFn6JVgnFjEUJKXM7GmY6GYAWEYh7/ABxDBELNOIxlDzKU/Sz+vGEKmVcLQd01TjPNhHtI1YQiJtTnBEMKQEENMDNJT4Zj0kTIECY5kKIkxQq6pYAim/H2qYIgGg58PhWpUzFDzpR4ybHFSqBhOQmrKgWWOkCkkGWI6T5LbRxuiCmfwGLT3NIIhxAZyhtCEPrImBiQk9Azh+TE3bZpE96DJIhnitm8Khlh5lNzVDfNUMQQTGzFEh2kDMpuKoWS1iAXDBUNJXk7GENpH/eIRrFqIPPU5M+hcSxlCY/B8aRQgRQyfoDPR91MyBA+P8V/wqx0BQ8w+TaQMcWpJlEDAgOGtYIi5CZTIV/xgiIlXeYw0/YwYYnJQwhCLX0KGT+jJ8REdRLJ+COTkDDENGp4jYgjHIhli0AwjwISbmmIY3n1J+QKqp+CZSDZRbKDfEEPQPYyuFEOcIYgYYkQVMRQPCDBEVy5p3gN9IMgQTbFk/xzqBzE5K9mkAKEuWvxZ+CK+MkOINqIJLsxxlm9d+XTJUJzjC6f/JQyxZKBgQ+0QJnQlDBGmFQwDvw54fYIhJvdUDKHjojQXQxioYIjNm8jX8QQagvdXMAw6MnjQJhiiMS33fHnFH4uoYIjN+d5fBYaYJ9QxhPnY4lcQYYupmCFGuAqGM5grEQwhwx8xBFcoZYgDEeV8xt4SJmGI8xZDhiFJiNdLpbOXIDQMcVaynGF4P43awyAYYgQy0jDEt6gXkFENXxd9PH4dMURlgJJgiK3SG3Mx4Vw/zKDhBFXJECYQTDMMQR/iGOIOAGZ0EQxxrqOcIbzHyHfXd3CmgiHuvJYyxIErAMEQxnclDLExxTdImYYYY0gYYuNNzBCSsWUIlSLphiFOOJEwxCmRcoY4L8GDqCDiw3z0pcEZf8wfyRni5EfJVDBOslIxhDSsgmG4sFgxhMl/KoaYo5IzBD/3A6vB/UPBEHcJyBnidMmQYTgWAYa4R1nJUByLByzNACpCMsTWD0kEDNUTXIoY4y0LhhgllZ4+3HseFMQzrMJyhnDPkCGGfnESCdMQljHiKiWD4DKQIUZJMUOMxYJBK/eNUIEuYigrpthxzx8B4e9KGGJqRMkQJyCHfBbwfG3nxKk8KEPsDwzjz1ADCLdK0qIHzRswhND8r4Qh3hRZ6hhiylsy8q0ARh3BdWRTRcpQrAFB9GQMoaoVMsR0tGBoiwJOuULMg3uEkuCdJD4Y4pQCsRsfRqsYn0QM9aYJ93DI5j3gpGvfPeB+GznDCXqMOIM05x0i9q5BrBQOMWQK52ckw8AQdidJGAZ75VBOJQxxfZ2iLwnG/4oZ8vcbNsdQFtgHJyzJlVAxFO9SYuIkDD/QWqoYvgcd4WUYYs5JExJIGIZb9XBckmKIEbUmdP+CIeYalQx9cxMxTPDWJXAEaoYS3SoZbjFXr2Aozg8lfL3nTYIhnDuhYjiEUK9iiK5GleP8BDupfYYoJyiMR3CcPUQ7KGGIbr2cIdZ+FQyjIx4YAm/xgHH0GDF8JIZYmcU4Tc4QQz3JUDIP5R6wMquMlxhDmI6lZthE2ygxhAiRhCG2PqkYhosPcINpzlAYfcHwl5whTlBRMsSUt4ohFCYlw+BsOww+MHVXzTCeERPOkYthiAXzOG1wFcFw/oD1Oeo8FDuZf9eJGWLVT8kQ04qS+sFKGMpXzJDXlTHE/auPxdA5UjtfwkVNNUP/DgFDLHfKGfp3oBnCoauEDL33+TgMbUw+KRlCJVXB0ElxRmYfGOKeuQdjiJI+EcOHYwjhYyVDHOiglBve8V/FcIB+VMZQ8m4LXOb0GQYHNxsxHEFQaMLwtNW9/xtc/U4znGPCXMkwfIFrUobnH55hcDhCMoafLEOnkiGO2kkZHq6Sbc1Fhn5PwYHAzzBOk+xbD99iqGMYnlFbZvg6jcsBuaM0DL/KnSr50ZlAklYwDJwhdkjJGCZniLEBaFg91jBMcHo3rrtriLPvVAyvWfY55nf8p4jTEjN8LRmGK2IQp8kYzs6sCbsFhqjPyRji/mElw2Jdo+YE9xfcDVdwxiMxHJQXi04VVDPc70MHhiG9JEOIpkKGVcYP0vQcFa83jRjG71gqDp22JlWG8+jtOOFbW1QM5+PF4oRvJcK3JykZfl9v4dsc40NfMvS9xiR6NVT0Pjshw3O86fqeVhjir/YJGHrqn0Tnnys44zcqPQ7D+MXp98Qvf49fMf84DONXmh8OhQrK92Md1Swn/7gMXS+3zUz1u9OEa4hO/fvTHpHhZPa7Px+Gu9XDMCx03Jvuzl/8f5D63xTLdbsrZvgfr6zR1ELhTbQAAAAASUVORK5CYII=';

/**
 * Renderiza o logo da Maria Faz no cabeçalho de um documento PDF
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página
 * @param useWhiteVersion Se true, usa a versão branca do logo (para fundos escuros)
 */
export function renderLogoHeader(doc: jsPDF, pageWidth: number, useWhiteVersion: boolean = false): void {
  try {
    // Usar o logo PNG oficial
    const logoHeight = 12;
    const logoWidth = 40; // Proporção do logo
    const logoX = pageWidth - logoWidth - 5;
    const logoY = 2;
    doc.addImage(LOGO_MF_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (e) {
    console.error('Erro ao renderizar logo:', e);
    // Fallback: apenas o texto
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(useWhiteVersion ? 255 : 33, useWhiteVersion ? 255 : 33, useWhiteVersion ? 255 : 33);
    doc.setFontSize(10);
    doc.text('MARIA FAZ', pageWidth - 15, 10, { align: 'right' });
  }
}

/**
 * Renderiza o logo da Maria Faz no rodapé de um documento PDF
 * @param doc Documento jsPDF
 * @param pageWidth Largura da página
 * @param pageHeight Altura da página
 */
export function renderLogoFooter(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  try {
    // Usar uma versão menor do logo no rodapé
    const logoSize = 10;
    const logoX = pageWidth / 2 - logoSize;
    const logoY = pageHeight - 22;
    doc.addImage(LOGO_MF_BASE64, 'PNG', logoX, logoY, logoSize * 2, logoSize);
  } catch (e) {
    console.error('Erro ao renderizar logo no rodapé:', e);
    // Fallback: desenhar logo simplificado
    const logoSize = 8;
    const logoX = pageWidth / 2 - logoSize / 2;
    const logoY = pageHeight - 22;
    
    // Marca simplificada com as iniciais "MF"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(33, 33, 33);
    doc.text('MARIA FAZ', pageWidth / 2, pageHeight - 18, { align: 'center' });
  }
}