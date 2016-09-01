import {Directive, ElementRef, EventEmitter, HostListener, Input, OnChanges, SimpleChange, Output} from "@angular/core";
import {BaseChartDirective} from "./base-chart.directive";

declare var sentio: Object;

@Directive({
	selector: "timeline-line"
})
export class TimelineLineDirective
	extends BaseChartDirective
	implements OnChanges {

	@Input() model: Object[];
	@Input() markers: Object[];
	@Input() yExtent: Object[];
	@Input() xExtent: Object[];

	@Input() resizeWidth: boolean;
	@Input() resizeHeight: boolean;
	@Input() duration: number;

	@Input("configure") configureFn: (chart: any) => void;

	@Input() filterEnabled: boolean;
	@Input("filter") filterState: Object[];
	@Output() filterChange: EventEmitter<Object[]> = new EventEmitter();

	@Output() markerOver: EventEmitter<Object> = new EventEmitter();
	@Output() markerOut: EventEmitter<Object> = new EventEmitter();
	@Output() markerClick: EventEmitter<Object> = new EventEmitter();

	constructor(el: ElementRef) {
		super(el, sentio.timeline.line());
	}

	/**
	 * For the timeline, both dimensions scale independently
	 */
	setChartDimensions(width: number, height: number): void {
		let redraw: boolean = false;

		if(null != this.chart.width) {
			if(null != width && this.chart.width() != width) {
				this.chart.width(width);
				redraw = true;
			}
		}

		if(null != this.chart.height) {
			if(null != height && this.chart.height() != height) {
				this.chart.height(height);
				redraw = true;
			}
		}

		if(redraw) {
			this.chart.resize().redraw();
		}
	}

	@HostListener("window:resize", ["$event"])
	onResize(event) {
		if (this.resizeHeight || this.resizeWidth) {
			this.delayResize();
		}
	}

	ngOnInit() {

		// Do the initial resize if either dimension is supposed to resize
		if (this.resizeHeight || this.resizeWidth) {
			this.resize();
		}

		// register for the filter end event
		this.chart.filter().on("filterend", (fs) => {
			// If the filter actually changed, emit the event
			if(this.filterChanged(fs, this.filterState)) {
				this.filterChange.emit((null != fs && !fs[0])? fs : undefined)
			}
		});

		// register for the marker events
		this.chart.markers().on("mouseover", p => { this.markerClick.emit(p); });
		this.chart.markers().on("mouseout", p => { this.markerOver.emit(p); });
		this.chart.markers().on("click", p => { this.markerOut.emit(p); });

	}

	ngOnChanges(changes: { [key: string]: SimpleChange }) {

		let redraw: boolean = false;

		// Call the configure function
		if (changes["configureFn"] && changes["configureFn"].isFirstChange()
				&& null != changes["configureFn"].currentValue) {
			this.configureFn(this.chart);
		}

		if (changes["model"]) {
			this.chart.data(changes["model"].currentValue);
			redraw = true;
		}
		if (changes["yExtent"]) {
			this.chart.yExtent().overrideValue(changes["yExtent"].currentValue);
			redraw = true;
		}
		if (changes["xExtent"]) {
			this.chart.xExtent().overrideValue(changes["xExtent"].currentValue);
			redraw = true;
		}
		if (changes["duration"]) {
			this.chart.duration(changes["duration"].currentValue);
		}

		if (changes["filterEnabled"]) {
			this.chart.filter(changes["filterEnabled"].currentValue);
			redraw = true;
		}
		if (changes["filterState"]) {
			let currFilter = changes["filterState"].currentValue;
			this.chart.setFilter((currFilter != null && currFilter.length > 2)? currFilter.slice(1,3) : currFilter);
			redraw = true;
		}

		if (changes["markers"]) {
			this.chart.markers(changes["markers"].currentValue);
			redraw = true;
		}

		if(redraw) {
			this.chart.redraw();
		}
	}

	filterChanged = (current: Object[], previous: Object[]) => {

		// Deep compare the filter
		if(null != current && null != previous
			&& current.length === previous.length
			&& current[0] === previous[0]
			&& current[1] === previous[1]
			&& current[2] === previous[2]) {
			return false;
		}

		// We know it changed
		return true;
	}
}
