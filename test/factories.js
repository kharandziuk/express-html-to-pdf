const htmlFactory = (number) => (`<!doctype html>

<html lang="en">
<head>
  <meta charset="utf-8">

  <title>The HTML5 Herald</title>
  <meta name="description" content="The HTML5 Herald">
  <meta name="author" content="SitePoint">
</head>

<body>
  Something important ${number}
</body>
</html>`)

module.exports = {
  htmlFactory,
}