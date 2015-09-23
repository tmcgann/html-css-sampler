(function (module) {
    'use strict';

    module.exports = {
        buildDir: 'build',
        compileDir: 'bin',

        cssAutoPrefixerOptions: {
            cascade: true,
            remove: false
        },

        index: {
            name: 'index.html',
            styles: [
                'main.css'
            ]
        },

        appFiles: {
            // The main .html file for the SPA app.
            index: ['sampler.html'],

            // Generally there should only be one .scss file and all other files
            // should be imported from this one.
            styles: ['styles/main.scss'],

            delta: {
                styles: ['styles/*.scss', '.csslintrc']
            }
        },
    };
}(module));
