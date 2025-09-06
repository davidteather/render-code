import argparse
from cli.commands.setup import main as setup_main
from cli.commands.render_video import main as render_main
from cli.commands.export_project import main as export_main


def create_parser():
    parser = argparse.ArgumentParser(description="Render Markdown into animated code tutorials.")
    subparsers = parser.add_subparsers(help="Commands")

    # Subcommand for initial setup
    parser_parse = subparsers.add_parser('setup', help='Setup the project')
    parser_parse.set_defaults(func=setup_main)

    # Subcommand for rendering video using Remotion
    parser_render = subparsers.add_parser('render', help='Render a video from markdown using Remotion')
    parser_render.add_argument('file', help="Path to the markdown file")
    parser_render.add_argument('--preview', action='store_true', help='Enable preview mode (lower res/fps, faster)')
    parser_render.add_argument('--markdown-file', type=str, help='Name to use inside remotion/public (default: input.md)')
    parser_render.add_argument('--settings', type=str, help='Path to a settings.json to pass to Remotion')
    # Removed: skip-warnings; enforce fail-fast to keep outputs correct
    parser_render.set_defaults(func=render_main)

    # Subcommand for exporting the project to Premiere Pro
    parser_export = subparsers.add_parser('export', help='Export the project to Premiere Pro')
    parser_export.add_argument('file', help="Path to the markdown file")
    parser_export.set_defaults(func=export_main)

    return parser


def main():
    parser = create_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
