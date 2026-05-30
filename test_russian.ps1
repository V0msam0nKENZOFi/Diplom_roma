$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$p = $doc.Paragraphs.Add()
$p.Range.Text = "Test Russian text - Тест русского текста"
$p.Range.Font.Name = "Times New Roman"
$p.Range.Font.Size = 14
$outputPath = "C:\Users\vlvlk\Desktop\ЧМО\диплом\test_russian.docx"
$doc.SaveAs2([ref]$outputPath, [ref]16)
$doc.Close()
$word.Quit()
Write-Host "OK"
