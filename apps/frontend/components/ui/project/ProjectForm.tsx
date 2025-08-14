"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Calendar, Palette, X, ChevronDown } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useProjectStore } from "@/stores/projectStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { SidebarProject } from "@/lib/types/project";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { getAxiosErrorMessage } from "@/utils/errorMessage";

interface CreateProjectRequest {
  organization_id: string;
  name: string;
  description?: string;
  color?: string;
  start_date?: string;
  end_date?: string;
}

interface ProjectFormProps {
  onSubmit: (data: CreateProjectRequest) => Promise<SidebarProject>;
  loading?: boolean;
  onClose?: () => void;
}

export default function ProjectForm({ onSubmit, loading, onClose }: ProjectFormProps) {
  const activeOrg = useOrganizationStore((state) => state.activeOrg);
  const { projects, setProjects } = useProjectStore();
  
  const [form, setForm] = useState<CreateProjectRequest>({
    organization_id: activeOrg?.id || "",
    name: "",
    description: undefined,
    color: "#3B82F6",
    start_date: undefined,
    end_date: undefined,
  });

  const [isVisible, setIsVisible] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStartDateDropdown, setShowStartDateDropdown] = useState(false);
  const [showEndDateDropdown, setShowEndDateDropdown] = useState(false);
  const [showCustomStartDatePicker, setShowCustomStartDatePicker] = useState(false);
  const [showCustomEndDatePicker, setShowCustomEndDatePicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const colorRef = useRef<HTMLDivElement>(null);
  const startDateRef = useRef<HTMLDivElement>(null);
  const endDateRef = useRef<HTMLDivElement>(null);

  // Predefined colors
  const predefinedColors = [
    "#3B82F6", // Blue (default)
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#84CC16", // Lime
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F43F5E", // Rose
  ];

  // Date presets
  const datePresets = [
    { label: "Today", getValue: () => new Date().toISOString().split('T')[0] },
    { label: "Tomorrow", getValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { label: "Next Monday", getValue: () => getNextMonday() },
    { label: "In one week", getValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { label: "In two weeks", getValue: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { label: "In one month", getValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  ];

  function getNextMonday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday, next day is Monday
    const monday = new Date(today.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
    return monday.toISOString().split('T')[0];
  }

  // Sidebar state for responsive margin
  const sidebarHidden = useSidebarStore((state) => state.hidden);
  
  // Helper to get sidebar margin (responsive, SSR safe)
  const [sidebarMargin, setSidebarMargin] = useState('0');
  const [topMargin, setTopMargin] = useState('0');
  const [bottomPadding, setBottomPadding] = useState('0');

  // Animation entrance effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Update organization_id when activeOrg changes
  useEffect(() => {
    if (activeOrg?.id) {
      setForm(prev => ({ ...prev, organization_id: activeOrg.id }));
    }
  }, [activeOrg]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (startDateRef.current && !startDateRef.current.contains(event.target as Node)) {
        setShowStartDateDropdown(false);
      }
      if (endDateRef.current && !endDateRef.current.contains(event.target as Node)) {
        setShowEndDateDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Set margin and padding on client only
    function updateMargin() {
      if (window.innerWidth >= 768) {
        setSidebarMargin(sidebarHidden ? '4rem' : '18rem');
        setTopMargin('0');
        setBottomPadding('0');
        setIsMobile(false);
      } else {
        setSidebarMargin('0');
        setTopMargin('56px');
        setBottomPadding('56px');
        setIsMobile(true);
      }
    }
    updateMargin();
    window.addEventListener('resize', updateMargin);
    return () => window.removeEventListener('resize', updateMargin);
  }, [sidebarHidden]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "description" || name === "start_date" || name === "end_date") {
      setForm({ ...form, [name]: value ? value : undefined });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleClose = () => {
    if (onClose) {
      setIsVisible(false);
      setTimeout(onClose, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProject = await onSubmit(form);
      
      // Add new project to the beginning of the projects array
      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      
      // Close the form
      handleClose();
    } catch (error) {
      const errMsg = getAxiosErrorMessage(error);
      toast.error(errMsg);
    }
  };

  const setStartDate = (date: string) => {
    setForm(prev => ({ ...prev, start_date: date }));
    setShowStartDateDropdown(false);
    setShowCustomStartDatePicker(false);
  };

  const setEndDate = (date: string) => {
    setForm(prev => ({ ...prev, end_date: date }));
    setShowEndDateDropdown(false);
    setShowCustomEndDatePicker(false);
  };

  const removeStartDate = () => {
    setForm(prev => ({ ...prev, start_date: undefined }));
    setShowStartDateDropdown(false);
    setShowCustomStartDatePicker(false);
  };

  const removeEndDate = () => {
    setForm(prev => ({ ...prev, end_date: undefined }));
    setShowEndDateDropdown(false);
    setShowCustomEndDatePicker(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const shouldShowStartDateText = () => {
    return !isMobile || form.start_date;
  };

  const shouldShowEndDateText = () => {
    return !isMobile || form.end_date;
  };

  const shouldShowColorText = () => {
    return !isMobile || form.color !== "#3B82F6";
  };

  return (
    <>
      <div 
        className={`fixed inset-0 flex items-start justify-center z-50 p-4 pt-20 transition-all duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          marginLeft: sidebarMargin,
          marginTop: topMargin,
          paddingBottom: bottomPadding,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className={`bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-lg w-full max-w-md mx-auto transform transition-all duration-300 ease-out ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Plus size={16} className="text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-100">New Project</h2>
            </div>
            {onClose && (
              <button
                onClick={handleClose}
                className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Project Name */}
            <div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Project name"
                className="w-full px-0 py-2 bg-transparent text-neutral-100 placeholder-neutral-500 border-0 border-b border-transparent focus:border-blue-500/50 focus:outline-none text-lg font-medium transition-colors"
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                name="description"
                value={form.description ?? ""}
                onChange={handleChange}
                placeholder="Add description..."
                className="w-full px-0 py-2 bg-transparent text-neutral-300 placeholder-neutral-500 border-0 resize-none focus:outline-none text-sm"
                rows={2}
              />
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2 py-2">
              {/* Color Picker */}
              <div className="relative" ref={colorRef}>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${
                    isMobile && !shouldShowColorText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                  }`}
                  aria-label={isMobile && !shouldShowColorText() ? "Color" : undefined}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-neutral-600/50" 
                    style={{ backgroundColor: form.color }}
                  />
                  {shouldShowColorText() && (
                    <span className="text-xs">Color</span>
                  )}
                </button>
                
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-3">
                      <div className="text-xs font-medium text-neutral-400 mb-3">
                        Choose a color
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({ ...prev, color }));
                              setShowColorPicker(false);
                            }}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              form.color === color 
                                ? 'border-white scale-110' 
                                : 'border-neutral-600/50 hover:border-neutral-500 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-neutral-700/50">
                        <input
                          type="color"
                          value={form.color}
                          onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full h-8 bg-transparent border border-neutral-600/50 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Start Date Dropdown */}
              <div className="relative" ref={startDateRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowStartDateDropdown(!showStartDateDropdown);
                    setShowCustomStartDatePicker(false);
                  }}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${
                    isMobile && !shouldShowStartDateText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                  }`}
                  aria-label={isMobile && !shouldShowStartDateText() ? "Start Date" : undefined}
                >
                  <Calendar size={14} />
                  {shouldShowStartDateText() && (
                    <span className="text-xs">
                      {form.start_date ? formatDate(form.start_date) : (isMobile ? "Start" : "Start Date")}
                    </span>
                  )}
                </button>
                
                {/* Dropdown for desktop */}
                {!isMobile && showStartDateDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-1">
                      {datePresets.slice(0, 4).map(({ label, getValue }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setStartDate(getValue())}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        >
                          <span>{label}</span>
                          <span className="text-xs text-neutral-500">
                            {new Date(getValue()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-neutral-700/50 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomStartDatePicker(true)}
                          className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        >
                          <Calendar size={14} className="mr-2" />
                          <span>Custom...</span>
                        </button>
                        {form.start_date && (
                          <button
                            type="button"
                            onClick={removeStartDate}
                            className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                          >
                            <X size={14} className="mr-2" />
                            <span>Remove Start Date</span>
                          </button>
                        )}
                      </div>
                      {showCustomStartDatePicker && (
                        <div className="mt-2 px-2 pb-2">
                          <DatePicker
                            selected={form.start_date ? new Date(form.start_date) : null}
                            onChange={(date: Date | null) => {
                              if (date) {
                                setStartDate(date.toISOString().split('T')[0]);
                              }
                            }}
                            inline
                            calendarClassName="dark-datepicker"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustomStartDatePicker(false)}
                            className="mt-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal for mobile */}
                {isMobile && showStartDateDropdown && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
                    <div className="bg-neutral-900 rounded-xl shadow-2xl p-4 w-[90vw] max-w-xs flex flex-col items-center">
                      <div className="mb-2 text-sm text-neutral-300 font-semibold">Select Start Date</div>
                      <DatePicker
                        selected={form.start_date ? new Date(form.start_date) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            setStartDate(date.toISOString().split('T')[0]);
                          }
                        }}
                        inline
                        calendarClassName="dark-datepicker"
                      />
                      <div className="flex gap-2 mt-2">
                        {form.start_date && (
                          <button
                            type="button"
                            onClick={removeStartDate}
                            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-neutral-800/50 rounded transition-colors"
                          >
                            Remove
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowStartDateDropdown(false)}
                          className="px-4 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* End Date Dropdown */}
              <div className="relative" ref={endDateRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEndDateDropdown(!showEndDateDropdown);
                    setShowCustomEndDatePicker(false);
                  }}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-md transition-colors ${
                    isMobile && !shouldShowEndDateText() ? "justify-center w-9 h-9 px-0 py-0" : ""
                  }`}
                  aria-label={isMobile && !shouldShowEndDateText() ? "End Date" : undefined}
                >
                  <Calendar size={14} />
                  {shouldShowEndDateText() && (
                    <span className="text-xs">
                      {form.end_date ? formatDate(form.end_date) : (isMobile ? "End" : "End Date")}
                    </span>
                  )}
                </button>
                
                {/* Dropdown for desktop */}
                {!isMobile && showEndDateDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-800/95 backdrop-blur-xl border border-neutral-700/50 rounded-lg shadow-xl z-10">
                    <div className="p-1">
                      {datePresets.map(({ label, getValue }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setEndDate(getValue())}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        >
                          <span>{label}</span>
                          <span className="text-xs text-neutral-500">
                            {new Date(getValue()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-neutral-700/50 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomEndDatePicker(true)}
                          className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                        >
                          <Calendar size={14} className="mr-2" />
                          <span>Custom...</span>
                        </button>
                        {form.end_date && (
                          <button
                            type="button"
                            onClick={removeEndDate}
                            className="w-full flex items-center px-3 py-2 text-sm text-neutral-300 hover:text-neutral-100 hover:bg-neutral-700/50 rounded-md transition-colors"
                          >
                            <X size={14} className="mr-2" />
                            <span>Remove End Date</span>
                          </button>
                        )}
                      </div>
                      {showCustomEndDatePicker && (
                        <div className="mt-2 px-2 pb-2">
                          <DatePicker
                            selected={form.end_date ? new Date(form.end_date) : null}
                            onChange={(date: Date | null) => {
                              if (date) {
                                setEndDate(date.toISOString().split('T')[0]);
                              }
                            }}
                            minDate={form.start_date ? new Date(form.start_date) : undefined}
                            inline
                            calendarClassName="dark-datepicker"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCustomEndDatePicker(false)}
                            className="mt-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal for mobile */}
                {isMobile && showEndDateDropdown && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
                    <div className="bg-neutral-900 rounded-xl shadow-2xl p-4 w-[90vw] max-w-xs flex flex-col items-center">
                      <div className="mb-2 text-sm text-neutral-300 font-semibold">Select End Date</div>
                      <DatePicker
                        selected={form.end_date ? new Date(form.end_date) : null}
                        onChange={(date: Date | null) => {
                          if (date) {
                            setEndDate(date.toISOString().split('T')[0]);
                          }
                        }}
                        minDate={form.start_date ? new Date(form.start_date) : undefined}
                        inline
                        calendarClassName="dark-datepicker"
                      />
                      <div className="flex gap-2 mt-2">
                        {form.end_date && (
                          <button
                            type="button"
                            onClick={removeEndDate}
                            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-neutral-800/50 rounded transition-colors"
                          >
                            Remove
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowEndDateDropdown(false)}
                          className="px-4 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 rounded transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Display */}
            {(form.start_date || form.end_date) && (
              <div className="flex items-center gap-2 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                <Calendar size={14} className="text-neutral-400" />
                <span className="text-sm text-neutral-300">
                  {form.start_date && form.end_date 
                    ? `${formatDate(form.start_date)} → ${formatDate(form.end_date)}`
                    : form.start_date 
                      ? `Starts ${formatDate(form.start_date)}`
                      : `Ends ${formatDate(form.end_date)}`
                  }
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800/30">
              {onClose && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !form.name.trim() || !form.organization_id}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}