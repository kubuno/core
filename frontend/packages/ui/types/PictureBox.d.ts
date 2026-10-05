import React from 'react';
/** How the picture fills the box (the desktop's `PictureBoxSizeMode` names). */
export type PictureSizeMode = 'Normal' | 'Stretch' | 'Zoom' | 'Center' | 'Cover';
export interface PictureBoxProps {
    /** The picture's address. */
    src?: string;
    /** Alternative text (`AccessibleName`); empty = a decorative picture, hidden from screen readers. */
    alt?: string;
    sizeMode?: PictureSizeMode;
    /** Rounded corners, in pixels. */
    cornerRadius?: number;
    /** `FixedSingle`: a line in the theme's border colour around the box. */
    borderStyle?: 'None' | 'FixedSingle';
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
}
/**
 * A picture (the `.kbview` `PictureBox`): an `<img>` laid out by `SizeMode` like the desktop's (object-fit), with
 * rounded corners and an optional border. Without a picture the box keeps its size, empty.
 */
export declare const PictureBox: React.ForwardRefExoticComponent<PictureBoxProps & React.RefAttributes<HTMLImageElement>>;
