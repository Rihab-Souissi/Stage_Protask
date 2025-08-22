import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface ApiResponse {
  TODO: number;
  IN_PROGRESS: number;
  VALIDATED: number;
  DONE: number;
}

interface Project {
  id: number;
  name: string;
}

interface ChartSegment {
  status: string;
  count: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  color: string;
  label: string;
}

@Component({
  selector: 'app-static',
  templateUrl: './static.component.html',
  styleUrls: ['./static.component.scss']
})
export class StaticComponent implements OnInit, AfterViewInit {
  private apiUrl: string = 'http://localhost:8088/api/v1/api/tickets/stats/status-count';

  colors: { [key: string]: string } = {
    'IN_PROGRESS': '#f59e0b',
    'IN_REVIEW': 'rgb(240, 223, 69)',
    'TODO': '#de5151',
    'DONE': '#24a495ff',
    'VALIDATED': '#4caf50'
  };
statusData = [
  { label: 'In Progress', color: '#f59e0b' },
  { label: 'In Review', color: 'rgb(240, 223, 69)' },
  { label: 'To Do', color: '#de5151' },
  { label: 'Done', color: '#24a495ff' }
];
  labels: { [key: string]: string } = {
    'IN_PROGRESS': 'In Progress',
    'IN_REVIEW': 'In Review',
    'TODO': 'To Do',
    'DONE': 'Done',
    'VALIDATED': 'Validated'
  };

  isLoading = true;
  hasError = false;
  totalCount = 0;
  segments: ChartSegment[] = [];

  // Pour la liste de projets
  projects: Project[] = [];
  selectedProject!: Project;
  totalProjectCount: number = 0;          
  totalTicketsForProject: number = 0; 
  projectStats: { status: string; count: number; percentage: number }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStatistics();
    this.loadProjects();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.segments.length > 0) {
        this.renderDonutChart();
      }
    }, 100);
  }

  /** --------- CHART GLOBAL ----------- */
  loadStatistics(): void {
    this.isLoading = true;
    this.hasError = false;

    this.http.get<ApiResponse>(this.apiUrl).subscribe({
      next: (data) => {
        this.buildChart(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des statistiques:', err);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  buildChart(data: ApiResponse): void {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    this.totalCount = total;

    if (total === 0) {
      this.hasError = true;
      return;
    }

    this.segments = [];
    let currentAngle = 0;

    Object.entries(data).forEach(([status, count]) => {
      const percentage = (count / total) * 100;
      const angle = (count / total) * 360;

      this.segments.push({
        status,
        count,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: this.colors[status],
        label: this.labels[status]
      });

      currentAngle += angle;
    });

    setTimeout(() => {
      this.renderDonutChart();
      this.renderLegend();
    }, 0);
  }

  renderDonutChart(): void {
    const svg = document.querySelector('.donut-chart') as SVGSVGElement;
    if (!svg) {
      console.error('SVG element not found');
      return;
    }

    svg.innerHTML = '';
    const radius = 70;
    const centerX = 100;
    const centerY = 100;

    this.segments.forEach((segment, index) => {
      const path = this.createArcPath(centerX, centerY, radius, segment.startAngle, segment.endAngle);

      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathElement.setAttribute('d', path);
      pathElement.setAttribute('stroke', segment.color);
      pathElement.setAttribute('stroke-width', '60');
      pathElement.setAttribute('fill', 'none');
      pathElement.setAttribute('class', `donut-segment segment-${segment.status.toLowerCase().replace('_', '-')}`);

      svg.appendChild(pathElement);
    });
  }

  createArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }
renderLegend(): void {
  const legend = document.getElementById('legend');
  if (!legend) return;

  legend.innerHTML = '';

  this.segments.forEach(segment => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    item.innerHTML = `
      <div class="legend-info" style="display: flex; align-items: center; gap: 8px;">
        <div class="legend-color" style="width: 16px; height: 16px; border-radius: 50%; background-color: ${segment.color};"></div>
        <span class="legend-label">${segment.label}</span>

      </div>
    `;

    legend.appendChild(item);
  });
}


  loadProjects(): void {
    this.http.get<Project[]>('http://localhost:8088/api/v1/api/projects').subscribe({
      next: (data) => {
        this.projects = data;
        this.totalProjectCount = data.length;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des projets :', err);
        this.totalProjectCount = 0;
      }
    });
  }

  onProjectChange(): void {
    if (!this.selectedProject) return;  

    const url = `http://localhost:8088/api/v1/api/tickets/stats/by-project?projectName=${this.selectedProject.name}`;
    this.http.get<{ [status: string]: number }>(url).subscribe({
      next: (data) => {
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        this.totalTicketsForProject = total;
        this.projectStats = Object.entries(data).map(([status, count]) => ({
          status,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }));
      },
      error: (err) => {
        console.error('Erreur chargement stats projet :', err);
        this.projectStats = [];
        this.totalProjectCount = 0;
      }
    });
  }
}
