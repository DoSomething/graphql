import markdown from 'markdown-it';
import {exists, readFile } from 'async-file';
import {resolve, extname } from 'path';
import asyncMiddleware from '../middleware/async';
import url from 'url';

export default ({ source }) => asyncMiddleware(async (req, res, next) => {
    const baseDirectory = resolve(source);
    let urlPath = req.url.toString().replace('docs/', '');

    // Only try to render Markdown files!
    const extension = extname(urlPath);
    if (! ['.md', '.markdown'].includes(extension)) {
      return next();
    }

    try {
      // Get the local file path.
      let filePath = resolve(baseDirectory + url.parse(urlPath).pathname);

      if (! await exists(filePath)) {
        return next();
      }

      const data = await readFile(filePath, 'utf8');
      const contents = markdown().render(data);

      // Render the documentation page!
      res.render('markdown', { contents, path: req.url.toString(), user: req.user });
    } catch (error) {
      return next(error);
    }
});
