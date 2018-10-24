'use strict';

function template(customer) {
  return `
  // =============================================================================
  // Variables
  // =============================================================================

  $create-font-face: true !default; // should the @font-face tag get created?

  // Should there be a custom class for each icon? will be .filename
  $create-icon-classes: true !default;

  // What is the common class name that icons share? in this case icons need to have .icon.filename in their classes
  // This requires you to have 2 classes on each icon html element, but reduced redeclaration of the font family
  // for each icon
  $icon-common-class: 'icon';

  // If you whish to prefix your filenames, here you can do so.
  // If this string stays empty, your classes will use the filename, for example
  // an icon called star.svg will result in a class called .star
  // Af you use the prefix to be 'icon-' it would result in .icon-star
  $icon-prefix: 'icon-';

  $icon-font-path: '../../Fonts/' !default;


  // =============================================================================
  // Functions
  // =============================================================================

  // Helper function to get the correct font group
  @function iconfont-group($group: null) {
    @if (null == $group) {
      $group: nth(map-keys($__iconfont__data), 1);
    }
    @if (false == map-has-key($__iconfont__data, $group)) {
      @warn 'Undefined Iconfont Family!';
      @return ();
    }
    @return map-get($__iconfont__data, $group);
  }

  // Helper function to get the correct icon of a group
  @function iconfont-item($name) {
    $slash: str-index($name, '/');
    $group: null;
    @if ($slash) {
      $group: str-slice($name, 0, $slash - 1);
      $name: str-slice($name, $slash + 1);
    } @else {
      $group: nth(map-keys($__iconfont__data), 1);
    }
    $group: iconfont-group($group);
    @if (false == map-has-key($group, $name)) {
      @warn 'Undefined Iconfont Glyph!';
      @return '';
    }
    @return map-get($group, $name);
  }


  // =============================================================================
  // Mixins
  // =============================================================================

  // Base mixing to setup base icon styles
  @mixin iconBase() {
    font-family: "${customer}-icons";
    font-style: normal;
    font-weight: 400;
    font-variant: normal;
    vertical-align: middle;
    speak: none;
    text-transform: none;

    /* Better Font Rendering on MacOSX */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  // Complete mixing to include the icon
  // Examples:
  // .my_icon{ @include icon(facebook) }
  @mixin icon($icon) {
    @include iconBase();
    content: iconfont-item($icon);
  }


  // =============================================================================
  // Fontface-Rules
  // =============================================================================

  // Creates the font face tag if the variable is set to true (default)
  @if $create-font-face == true{
    @font-face {
      font-family: "${customer}-icons";
      src: url('#{$icon-font-path}${customer}-icons.eot'); /* IE9 Compat Modes */
      src: url('#{$icon-font-path}${customer}-icons.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
      url('#{$icon-font-path}${customer}-icons.woff') format('woff'), /* Pretty Modern Browsers */
      url('#{$icon-font-path}${customer}-icons.ttf')  format('truetype'), /* Safari, Android, iOS */
      url('#{$icon-font-path}${customer}-icons.svg') format('svg'); /* Legacy iOS */
    }
  }


  // =============================================================================
  // Icon classes
  // =============================================================================

  // Creates icon classes for each individual loaded svg (default)
  @if $create-icon-classes == true{
    @each $family, $map in $__iconfont__data {
      @each $icon, $content in $map {
        .#{$icon-prefix}#{$icon}{
          &:before {
            @include icon($icon)
          }
        }
      }
    }
  }
  `;
}

function toSCSS(glyphs) {
	return JSON.stringify(glyphs, null, '\t')
		.replace(/\{/g, '(')
		.replace(/\}/g, ')')
		.replace(/\\\\/g, '\\');
}

module.exports = function(args) {
	const family = args.family;
  const pathToFonts = args.fontPath;
  const customerName = args.family.replace('-icons', '');
	const glyphs = args.unicodes.reduce(function(glyphs, glyph) {
		glyphs[glyph.name] = '\\' + glyph.unicode.charCodeAt(0).toString(16).toLowerCase();
		return glyphs;
	}, {});
  const data = {};
  const TEMPLATE = template(customerName);

	data[family] = glyphs;

    const replacements = {
        __FAMILY__: family,
        __RELATIVE_FONT_PATH__: pathToFonts,
        goat:"cat"
    };

    const str = TEMPLATE.replace(/__FAMILY__|__RELATIVE_FONT_PATH__|goat/gi, function(matched){
        return replacements[matched];
    });

	return [
		`$__iconfont__data: map-merge(if(global_variable_exists('__iconfont__data'), $__iconfont__data, ()), ${toSCSS(data)});`,
		str
	].join('\n\n');
};