$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$section = $doc.Sections.Item(1)
$section.PageSetup.TopMargin = $word.CentimetersToPoints(2)
$section.PageSetup.BottomMargin = $word.CentimetersToPoints(2)
$section.PageSetup.LeftMargin = $word.CentimetersToPoints(3)
$section.PageSetup.RightMargin = $word.CentimetersToPoints(1.5)
$section.PageSetup.PageWidth = $word.CentimetersToPoints(29.7)
$section.PageSetup.PageHeight = $word.CentimetersToPoints(21)

function Add-Paragraph($text, $size, $bold, $align) {
    $p = $doc.Paragraphs.Add()
    $p.Range.Text = $text
    $p.Range.Font.Name = "Times New Roman"
    $p.Range.Font.Size = $size
    $p.Range.Font.Bold = $bold
    $p.Alignment = $align
    $p.Range.ParagraphFormat.LineSpacingRule = 1.5
    return $p
}
function Add-EmptyLine {
    $p = $doc.Paragraphs.Add()
    $p.Range.Font.Size = 12
    $p.Range.Font.Name = "Times New Roman"
    return $p
}
function PageBreak {
    $doc.Bookmarks("\EndOfDoc").Range.InsertBreak(7)
}
Add-EmptyLine
Add-Paragraph "МИНИСТЕРСТВО ОБРАЗОВАНИЯ И НАУКИ РОССИЙСКОЙ ФЕДЕРАЦИИ" 14 $false 1
Add-Paragraph "ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ" 14 $false 1
Add-Paragraph "ВЫСШЕГО ОБРАЗОВАНИЯ" 14 $false 1
Add-Paragraph "САМАРСКИЙ ГОСУДАРСТВЕННЫЙ ТЕХНИЧЕСКИЙ УНИВЕРСИТЕТ" 14 $false 1
Add-EmptyLine
Add-Paragraph "Факультет среднего профессионального образования" 14 $false 1
Add-EmptyLine
Add-EmptyLine
Add-Paragraph "Специальность 09.02.07 Информационные системы и программирование" 14 $false 1
Add-EmptyLine
Add-EmptyLine
Add-Paragraph "ВЫПУСКНАЯ КВАЛИФИКАЦИОННАЯ РАБОТА" 16 $true 1
Add-EmptyLine
Add-Paragraph "на тему: Разработка веб-сайта сервисного центра" 14 $false 1
Add-Paragraph "по ремонту оргтехники ТехноСервис+" 14 $false 1
Add-EmptyLine
Add-EmptyLine
Add-Paragraph "Студент                        ____________________              И.О. Фамилия" 14 $false 3
Add-Paragraph "(подпись)" 9 $false 3
Add-Paragraph "Руководитель         ____________________              И.О. Фамилия" 14 $false 3
Add-Paragraph "(подпись)" 9 $false 3
Add-Paragraph "Рецензент            ____________________              И.О. Фамилия" 14 $false 3
Add-Paragraph "(подпись)" 9 $false 3
Add-Paragraph "Нормоконтролер       ____________________              И.О. Фамилия" 14 $false 3
Add-Paragraph "(подпись)" 9 $false 3
Add-EmptyLine
Add-Paragraph "Самара, 2026" 14 $false 1
Add-EmptyLine
PageBreak

$outputPath = "C:\Users\vlvlk\Desktop\ЧМО\диплом\Дипломный_проект_ТехноСервис+.docx"
$doc.SaveAs2([ref]$outputPath, [ref]16)
$doc.Close()
$word.Quit()
Write-Host "Done: $outputPath"
