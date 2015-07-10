module.exports = function(grunt) {

    grunt.initConfig({

        // Import package manifest
        pkg: grunt.file.readJSON("package.json"),

        // Banner definitions
        meta: {
            banner: "/*\n" +
                " *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
                " *  <%= pkg.description %>\n" +
                " *  <%= pkg.homepage %>\n" +
                " *\n" +
                " *  Made by <%= pkg.author.name %>\n" +
                " *  Under <%= pkg.license %> License\n" +
                " */\n"
        },

        // Concat definitions
        concat: {
            options: {
                banner: "<%= meta.banner %>"
            },
            dist: {
                src: ["src/jquery.stickyHooters.js"],
                dest: "dist/jquery.stickyHooters.js"
            }
        },

        // Copy definitions
        copy: {
            main: {
                src: ['dist/jquery.stickyHooters.js'],
                dest: 'demo/jquery.stickyHooters.js'
            }
        },

        // Lint definitions
        jshint: {
            files: ["src/jquery.stickyHooters.js"],
            options: {
                jshintrc: ".jshintrc"
            }
        },

        // Minify definitions
        uglify: {
            my_target: {
                src: ["dist/jquery.stickyHooters.js"],
                dest: "dist/jquery.stickyHooters.min.js"
            },
            options: {
                banner: "<%= meta.banner %>"
            }
        },

        // watch for changes to source
        // Better than calling grunt a million times
        // (call 'grunt watch')
        watch: {
            files: ['src/*'],
            tasks: ['default']
        }

    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("build", ["concat", "uglify", "copy"]);
    grunt.registerTask("default", ["jshint", "build"]);
    grunt.registerTask("travis", ["default"]);

};
