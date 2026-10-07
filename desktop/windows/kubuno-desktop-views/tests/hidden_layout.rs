//! Hidden children take no room, and a page covered by a ribbon's Backstage lays nothing else out:
//!
//! - a `<Stack>` (with cross alignment, as the header's cluster) gives a hidden child neither its explicit width nor
//!   a gap, so the shown ones keep their place;
//! - while the Backstage is open, the panel holding the ribbon paints none of its other children (an anchored
//!   control of a squeezed panel used to draw over the Backstage), and the ribbon raises `OnBackstageOpened` /
//!   `OnBackstageClosed`;
//! - `TitleBarInk` (the colour of the header's buttons) follows the band's ink of the frame.

use std::cell::RefCell;

use kubuno_desktop_controls::host::{self, Frame, Modifiers};
use kubuno_desktop_ui::graphics::testing::RecordingCanvas;
use kubuno_desktop_ui::Rect;
use kubuno_desktop_views::binding::{HandlerTable, MapViewModel, Value, ViewModel};
use kubuno_desktop_views::runtime::Runtime;

const WINDOW: Rect = Rect { left: 0.0, top: 0.0, right: 900.0, bottom: 600.0 };

thread_local! {
    static RAN: RefCell<Vec<&'static str>> = const { RefCell::new(Vec::new()) };
}

fn frame_at(mouse: Option<(f32, f32)>, down: bool) -> Frame {
    let (x, y) = mouse.unwrap_or((host::POINTER_AWAY, host::POINTER_AWAY));
    Frame {
        size: (WINDOW.right, WINDOW.bottom),
        mouse: (x, y),
        mouse_down: down,
        right_down: false,
        middle_down: false,
        dismiss: false,
        scale: 1.0,
        client_origin: (0.0, 0.0),
        work_area: (0.0, 0.0, WINDOW.right, WINDOW.bottom),
        chrome_top: 0.0,
        mods: Modifiers::NONE,
        wheel: (0.0, 0.0),
        click_count: 1,
        window_focused: true,
    }
}

fn runtime(view: &str) -> Runtime {
    let mut rt = Runtime::new();
    assert!(rt.reload_from_text(view), "{:?}", rt.diagnostics());
    rt
}

fn paint(rt: &mut Runtime, vm: &mut MapViewModel, handlers: &mut HandlerTable, f: Frame) -> Vec<String> {
    let canvas = RecordingCanvas::new();
    rt.frame(&canvas, &f, vm, handlers, WINDOW);
    canvas.calls()
}

/// The rectangle a recorded call names (`fill_rounded(1,2,3,4 r=2)` → 1,2,3,4).
fn rect_of(call: &str) -> Option<Rect> {
    call.split(['(', ')', ' ']).find_map(|token| {
        let v: Vec<f32> = token.split(',').map(|n| n.parse::<f32>()).collect::<Result<_, _>>().ok()?;
        (v.len() == 4).then(|| Rect::new(v[0], v[1], v[2], v[3]))
    })
}

#[test]
fn a_hidden_stack_child_takes_neither_its_width_nor_a_gap() {
    let view = r#"<Panel DesignWidth="400" DesignHeight="100">
  <Stack Direction="LeftToRight" Gap="10" CrossAlign="Center" X="0" Y="0" Width="400" Height="40">
    <Button Text="Hidden" Width="80" Height="30" Visible="false"/>
    <Button Text="Shown" Width="80" Height="30"/>
  </Stack>
</Panel>"#;
    let mut rt = runtime(view);
    let mut vm = MapViewModel::new();
    let mut handlers = HandlerTable::new();
    let calls = paint(&mut rt, &mut vm, &mut handlers, frame_at(None, false));
    assert!(!calls.iter().any(|c| c.contains("\"Hidden\"")), "{calls:#?}");
    let shown = calls.iter().find(|c| c.contains("text(\"Shown\"")).and_then(|c| rect_of(c)).unwrap_or_else(|| panic!("{calls:#?}"));
    assert!(shown.left < 1.0, "the shown button starts the row: {shown:?}");
}

const BACKSTAGE_VIEW: &str = r#"<Panel DesignWidth="900" DesignHeight="600">
  <Ribbon x:Name="ribbon" Dock="Top" OnBackstageOpened="opened" OnBackstageClosed="closed">
    <RibbonBackstage Header="Fichier">
      <BackstageTab Header="Informations" Icon="Info"><Label Text="Backstage page"/></BackstageTab>
    </RibbonBackstage>
    <RibbonTab Header="Accueil"><RibbonGroup Header="Groupe"><RibbonButton Label="Gras"/></RibbonGroup></RibbonTab>
  </Ribbon>
  <Panel Dock="Bottom" Height="30"><Label Text="Footer" X="0" Y="0" Width="200" Height="24"/></Panel>
  <Panel Dock="Fill"><Label Text="Anchored" X="10" Y="400" Width="200" Height="24" Anchor="Bottom, Left"/></Panel>
</Panel>"#;

#[test]
fn an_open_backstage_hides_the_page_and_raises_its_events() {
    RAN.with(|r| r.borrow_mut().clear());
    let mut rt = runtime(BACKSTAGE_VIEW);
    let mut vm = MapViewModel::new();
    let mut handlers = HandlerTable::new();
    handlers.insert("opened", Box::new(|_: &mut dyn ViewModel, _: Value| RAN.with(|r| r.borrow_mut().push("opened"))));
    handlers.insert("closed", Box::new(|_: &mut dyn ViewModel, _: Value| RAN.with(|r| r.borrow_mut().push("closed"))));
    let calls = paint(&mut rt, &mut vm, &mut handlers, frame_at(None, false));
    assert!(calls.iter().any(|c| c.contains("\"Anchored\"")) && calls.iter().any(|c| c.contains("\"Footer\"")), "the page shows: {calls:#?}");
    // The « Fichier » tab: the first of the tab strip.
    let file = calls.iter().find(|c| c.contains("text(\"Fichier\"")).and_then(|c| rect_of(c)).unwrap_or_else(|| panic!("the File tab is painted: {calls:#?}"));
    let at = Some(((file.left + file.right) / 2.0, (file.top + file.bottom) / 2.0));
    let mut last = Vec::new();
    for (mouse, down) in [(at, false), (at, true), (at, false), (None, false), (None, false), (None, false)] {
        last = paint(&mut rt, &mut vm, &mut handlers, frame_at(mouse, down));
    }
    assert_eq!(RAN.with(|r| r.borrow().clone()), ["opened"], "{last:#?}");
    assert!(last.iter().any(|c| c.contains("\"Backstage page\"")), "the Backstage shows: {last:#?}");
    assert!(!last.iter().any(|c| c.contains("\"Anchored\"") || c.contains("\"Footer\"")), "nothing of the page is drawn over the Backstage: {last:#?}");
}

#[test]
fn title_bar_ink_follows_the_band() {
    use kubuno_desktop_views::style::{parse_color, TITLE_BAR_INK};
    let theme = kubuno_desktop_ui::Theme::light();
    let ink = parse_color(TITLE_BAR_INK).ok().flatten().expect("TitleBarInk parses");
    // No coloured band: the theme's OnPrimary.
    assert_eq!(ink.resolve_with(&theme, false), theme.accent_foreground);
    // A ribbon recoloured the band this frame: its ink.
    let dark_ink = windows::Win32::Graphics::Direct2D::Common::D2D1_COLOR_F { r: 0.9, g: 0.9, b: 0.9, a: 1.0 };
    host::set_caption_colors(windows::Win32::Graphics::Direct2D::Common::D2D1_COLOR_F { r: 0.1, g: 0.1, b: 0.1, a: 1.0 }, dark_ink);
    assert_eq!(ink.resolve_with(&theme, false), dark_ink);
}
