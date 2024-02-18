# hubot-cantchart

Are you tired of your management team and co-workers having expectations about your work? We've experienced dozens or hundreds of reasons over the years that work can't be done -- even when critical. To show how you can't get any work done, you just put yourself on the can't chart. 

This is extension pulls for the wisdom of the crowd on [websages/hates-software/issues/1](https://github.com/websages/hates-software/issues/1), which is pertty much just perfect.


![Gantt Chart](https://i.imgur.com/HNBkC1B.png)

![Cant Chart](https://i.imgur.com/k5HfIYT.png)


# Installation

`npm i hubot-cantchart --save`

add `hubot-cantchart` to your `external-scripts` file.

# Configuration

You need a `HUBOT_GITHUB_TOKEN` environment variable set so you can make API calls to github. If one isn't found, it will fall back to `GITHUB_TOKEN`. If that is also not found, it will return an error.

# Usage

    hubot excuse - get a new excuse for why you can't get any work done

    hubot cant chart -- alias for excuse

    hubot can't chart -- alias for excuse


# Attribution

The concept of a "cant chart" came from [rick](https://github.com/rick). (Mr Cant Chart himself). See [the full presentation](https://www.slideshare.net/ogc/waxing-ballroom-floors-on-the-titanic) for all the fixin's. (slide 58+)

See also: [websages/hates-software](https://github.com/websages/hates-software/issues/)

# License 
MIT
