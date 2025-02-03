# Copy contents of all files in the current directory to a single file
{ find . -type d -not -path "./.*"; find . -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) -not -path "./.*" -not -name "complete_structure.txt" -exec echo -e "\nFile: {}\n" \; -exec cat {} \; } > complete_structure.txt

#start server
python -m SimpleHTTPServer 8000

## TODO
Add gallery of images
Host on Cloudfront
make tooltips go to the side of the buttons so that it doesnt cover
upcale images in blogs and hero, upscale a little for the thumbnails as well
change buttons to slide from left to right
services make align the headings, text and button. Also move it to before reviews
Give all titles on home page a purple underline
in the navbar underline the navigation based on where they are on the page
Blogs remove readmore button
