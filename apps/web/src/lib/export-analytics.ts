import type { AnalyticsData } from "@/fetchers/analytics/get-analytics";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export function exportToExcel(data: AnalyticsData, dateRangeLabel: string) {
  const periodText = data.period.label || dateRangeLabel;
  const date = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ["Reporte de Analítica"],
    [`Período: ${periodText}`],
    [`Fecha de generación: ${date}`],
    [],
    ["Métrica", "Valor"],
    ["Total de Tareas", data.summary.totalTasks],
    ["Tareas Completadas", data.summary.completedTasks],
    ["Tasa de Completado", data.summary.completionRate],
    ["Tareas Vencidas", data.summary.overdueTasks],
    ["Tareas Próximas a Vencer", data.summary.dueSoonTasks],
    ["Promedio por Día", data.summary.avgTasksPerDay],
    ["Proyectos Activos", data.summary.activeProjects],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  const statusData = [
    ["Estado", "Cantidad", "Porcentaje"],
    ["Por Hacer (To Do)", data.tasksByStatus.todo, 0],
    ["En Progreso", data.tasksByStatus.inProgress, 0],
    ["Revisión Técnica", data.tasksByStatus.technicalReview, 0],
    ["Completadas", data.tasksByStatus.completed, 0],
    ["Archivadas", data.tasksByStatus.archived ?? 0, 0],
  ];
  const totalStatus = Object.values(data.tasksByStatus).reduce(
    (a, b) => a + (typeof b === "number" ? b : 0),
    0,
  );
  for (const row of statusData.slice(1)) {
    row[2] =
      totalStatus > 0
        ? Math.round(((row[1] as number) / totalStatus) * 100)
        : 0;
  }
  const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
  statusSheet["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, statusSheet, "Por Estado");

  const priorityData = [
    ["Prioridad", "Cantidad", "Porcentaje"],
    ["Urgente", data.tasksByPriority.urgent, 0],
    ["Alta", data.tasksByPriority.high, 0],
    ["Media", data.tasksByPriority.medium, 0],
    ["Baja", data.tasksByPriority.low, 0],
  ];
  const totalPriority = Object.values(data.tasksByPriority).reduce(
    (a, b) => a + b,
    0,
  );
  for (const row of priorityData.slice(1)) {
    row[2] =
      totalPriority > 0
        ? Math.round(((row[1] as number) / totalPriority) * 100)
        : 0;
  }
  const prioritySheet = XLSX.utils.aoa_to_sheet(priorityData);
  prioritySheet["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, prioritySheet, "Por Prioridad");

  if (data.tasksByProject.length > 0) {
    const projectData = [
      [
        "Proyecto",
        "Total",
        "Completadas",
        "En Progreso",
        "Vencidas",
        "Tasa de Completado",
      ],
      ...data.tasksByProject.map((p) => [
        p.projectName,
        p.count,
        p.completed,
        p.inProgress,
        p.overdue,
        p.completionRate,
      ]),
    ];
    const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
    projectSheet["!cols"] = [
      { wch: 25 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, projectSheet, "Por Proyecto");
  }

  if (data.tasksByAssignee.length > 0) {
    const assigneeData = [
      [
        "Usuario",
        "Total Asignadas",
        "Completadas",
        "En Progreso",
        "Tasa de Completado",
      ],
      ...data.tasksByAssignee.map((u) => [
        u.userName,
        u.totalAssigned,
        u.completed,
        u.inProgress,
        u.completionRate,
      ]),
    ];
    const assigneeSheet = XLSX.utils.aoa_to_sheet(assigneeData);
    assigneeSheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, assigneeSheet, "Por Usuario");
  }

  if (data.recentTasks.length > 0) {
    const recentData = [
      [
        "Tarea",
        "Proyecto",
        "Estado",
        "Prioridad",
        "Asignado",
        "Fecha Límite",
        "Vencida",
      ],
      ...data.recentTasks.map((t) => [
        t.title,
        t.projectName,
        t.status,
        t.priority,
        t.assigneeName || "-",
        t.dueDate ? new Date(t.dueDate).toLocaleDateString("es-ES") : "-",
        t.isOverdue ? "Sí" : "No",
      ]),
    ];
    const recentSheet = XLSX.utils.aoa_to_sheet(recentData);
    recentSheet["!cols"] = [
      { wch: 35 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 8 },
    ];
    XLSX.utils.book_append_sheet(workbook, recentSheet, "Tareas del Período");
  }

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(
    blob,
    `reporte-analitica-${periodText.toLowerCase().replace(/\s+/g, "-")}.xlsx`,
  );
}
