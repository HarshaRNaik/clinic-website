"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";

import { registerClinic, signInClinic } from "@/lib/clinic-auth";
import { saveClinicProfile } from "@/lib/clinic-db";
import { generatePatientId } from "@/lib/security/patient-id";
import { checkPasswordSafety } from "@/lib/security/password";
import {
  DEMO_DOCTOR_EMAIL,
  DEMO_PATIENT_EMAIL,
  prototypeMode,
  startDemoTour,
} from "@/lib/prototype-mode";
import { seedPrototypeData } from "@/lib/prototype-seed";

type PortalRole = "patient" | "doctor";
type PatientMode = "signin" | "signup";

type FieldErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "email"
    | "dateOfBirth"
    | "gender"
    | "password"
    | "consent"
    | "identifier",
    string
  >
>;

type PatientForm = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  password: string;
  consent: boolean;
};

const patientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(60, "Name must be 60 characters or fewer.")
    .regex(
      /^[A-Za-z' -]+$/,
      "Use letters, spaces, apostrophes, or hyphens only.",
    ),

  phone: z
    .string()
    .transform((value) =>
      value.replace(/[\s-]/g, "").replace(/^\+91/, ""),
    )
    .pipe(
      z
        .string()
        .regex(
          /^[6-9]\d{9}$/,
          "Enter a valid 10-digit Indian mobile number.",
        ),
    ),

  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value || z.string().email().safeParse(value).success,
      "Enter a valid email address.",
    ),

  dateOfBirth: z.string().refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    const now = new Date();

    if (!value || Number.isNaN(date.getTime()) || date > now) {
      return false;
    }

    const age =
      now.getFullYear() -
      date.getFullYear() -
      (now.getMonth() < date.getMonth() ||
      (now.getMonth() === date.getMonth() &&
        now.getDate() < date.getDate())
        ? 1
        : 0);

    return age >= 0 && age <= 120;
  }, "Enter a real date of birth between 0 and 120 years ago."),

  gender: z.enum(
    ["Female", "Male", "Other", "Prefer not to say"],
    {
      error: "Select an option.",
    },
  ),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters."),

  consent: z.literal(true, {
    error: "Consent is required to create an account.",
  }),
});

function roleFromQuery(
  value: string | null,
): PortalRole | null {
  if (value === "patient" || value === "doctor") {
    return value;
  }

  return null;
}

function validatePatientForm(
  form: PatientForm,
): FieldErrors {
  const result = patientSchema.safeParse(form);

  if (result.success) {
    return {};
  }

  return Object.fromEntries(
    result.error.issues.map((issue) => [
      String(issue.path[0]),
      issue.message,
    ]),
  );
}

function validatePatientSignup(
  form: PatientForm,
): FieldErrors {
  if (!prototypeMode) {
    return validatePatientForm(form);
  }

  const nextErrors: FieldErrors = {};

  if (!form.fullName.trim()) {
    nextErrors.fullName = "Enter your name.";
  }

  if (!form.password.trim()) {
    nextErrors.password = "Enter a password.";
  }

  return nextErrors;
}

function SplitLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const firstFieldRef =
    useRef<HTMLInputElement>(null);

  /*
   * Keep initial state deterministic.
   * URL state is synchronized after hydration.
   */
  const [openRole, setOpenRole] =
    useState<PortalRole | null>(null);

  const [patientMode, setPatientMode] =
    useState<PatientMode>("signin");

  const [patientOnboarded, setPatientOnboarded] =
    useState(false);

  const [identifier, setIdentifier] =
    useState("");

  const [patientForm, setPatientForm] =
    useState<PatientForm>({
      fullName: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      password: "",
      consent: false,
    });

  const [errors, setErrors] =
    useState<FieldErrors>({});

  const [touched, setTouched] =
    useState<
      Partial<Record<keyof FieldErrors, boolean>>
    >({});

  const [pending, setPending] =
    useState(false);

  const [attempted, setAttempted] =
    useState(false);

  /*
   * Synchronize portal state with URL.
   */
  useEffect(() => {
    const role = roleFromQuery(
      searchParams.get("role"),
    );

    setOpenRole(role);
  }, [searchParams]);

  /*
   * Load patient onboarding state.
   */
  useEffect(() => {
    const onboarded =
      window.localStorage.getItem(
        "arogya-patient-onboarded",
      ) === "true";

    setPatientOnboarded(onboarded);

    const role = roleFromQuery(
      searchParams.get("role"),
    );

    if (!onboarded && role === "patient") {
      setPatientMode("signup");
    }
  }, [searchParams]);

  /*
   * Seed prototype data once.
   */
  useEffect(() => {
    void seedPrototypeData();
  }, []);

  /*
   * Focus first form field after opening.
   */
  useEffect(() => {
    if (!openRole) {
      return;
    }

    const timer = window.setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [openRole, patientMode]);

  /*
   * Close active portal.
   */
  const closePanel = useCallback(() => {
    setOpenRole(null);
    setPatientMode("signin");
    setErrors({});
    setTouched({});
    setAttempted(false);

    router.replace("/");
  }, [router]);

  /*
   * Escape closes active portal.
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && openRole) {
        closePanel();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [closePanel, openRole]);

  /*
   * Open patient/doctor portal.
   */
  const openPanel = useCallback(
    (role: PortalRole) => {
      setOpenRole(role);

      setPatientMode(
        role === "patient" && !patientOnboarded
          ? "signup"
          : "signin",
      );

      setErrors({});
      setTouched({});
      setAttempted(false);

      router.replace(`/?role=${role}`);
    },
    [patientOnboarded, router],
  );

  function updatePatientField(
    field: keyof PatientForm,
    value: string | boolean,
  ) {
    setPatientForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function blurPatientField(
    field: keyof FieldErrors,
  ) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    if (patientMode === "signup") {
      const nextErrors =
        validatePatientSignup(patientForm);

      setErrors((current) => ({
        ...current,
        [field]: nextErrors[field],
      }));

      return;
    }

    if (
      field === "identifier" &&
      !identifier.trim()
    ) {
      setErrors((current) => ({
        ...current,
        identifier:
          "Enter your email or mobile number.",
      }));
    }

    if (
      field === "password" &&
      !patientForm.password.trim()
    ) {
      setErrors((current) => ({
        ...current,
        password: "Enter your password.",
      }));
    }
  }

  /*
   * Demo login.
   */
  async function enterDemo(role: PortalRole) {
    if (pending) {
      return;
    }

    console.log("DEMO START:", role);

    setPending(true);
    setErrors({});

    try {
      console.log("Seeding prototype data...");

      await seedPrototypeData({
        resetTour: true,
        force: true,
      });

      console.log("Prototype data seeded");

      startDemoTour(role);

      console.log("Demo tour started");

      const email =
        role === "doctor"
          ? DEMO_DOCTOR_EMAIL
          : DEMO_PATIENT_EMAIL;

      const authRole =
        role === "doctor"
          ? "staff"
          : "patient";

      console.log("Signing in:", {
        email,
        role: authRole,
      });

      const response = await signInClinic({
        email,
        password:
          role === "doctor"
            ? "Doctor@123"
            : "Patient@123",
        role: authRole,
      });

      console.log(
        "SIGN IN RESPONSE:",
        response,
      );

      if (!response.ok) {
        console.error(
          "DEMO LOGIN FAILED:",
          response,
        );

        setErrors({
          identifier:
            response.message ||
            "Demo login failed. Please try again.",
        });

        return;
      }

      if (role === "patient") {
        window.localStorage.setItem(
          "arogya-patient-onboarded",
          "true",
        );
      }

      const destination =
        role === "doctor"
          ? "/staff"
          : "/patient";

      console.log(
        "REDIRECTING TO:",
        destination,
      );

      router.push(destination);
    } catch (error) {
      console.error(
        "DEMO ERROR:",
        error,
      );

      setErrors({
        identifier:
          "Unable to enter demo mode. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  /*
   * Normal sign-in / signup.
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!openRole || pending) {
      return;
    }

    setAttempted(true);

    /*
     * PATIENT SIGNUP
     */
    if (
      openRole === "patient" &&
      patientMode === "signup"
    ) {
      const nextErrors =
        validatePatientSignup(patientForm);

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);

        window.setTimeout(() => {
          document
            .querySelector<HTMLElement>(
              "[aria-invalid='true']",
            )
            ?.focus();
        }, 0);

        return;
      }

      if (!prototypeMode) {
        const passwordCheck =
          await checkPasswordSafety(
            patientForm.password,
          );

        if (!passwordCheck.ok) {
          setErrors({
            password: passwordCheck.message,
          });

          return;
        }
      }

      setPending(true);

      try {
        const normalizedPhone =
          patientForm.phone
            .replace(/[\s-]/g, "")
            .replace(/^\+91/, "");

        const accountEmail =
          patientForm.email
            .trim()
            .toLowerCase() ||
          `${
            normalizedPhone ||
            `patient-${Date.now()}`
          }@patient.local`;

        const response =
          await registerClinic({
            email: accountEmail,
            password: patientForm.password,
            role: "patient",
            phone: normalizedPhone,
          });

        if (!response.ok) {
          setErrors({
            phone:
              response.message?.includes(
                "already exists",
              )
                ? "An account already exists for this number. Sign in or reset your password."
                : response.message ||
                  "Unable to create account.",
          });

          return;
        }

        await saveClinicProfile(
          {
            id: generatePatientId(),
            fullName:
              patientForm.fullName.trim(),
            phone: normalizedPhone,
            email:
              patientForm.email
                .trim()
                .toLowerCase() ||
              undefined,
            dateOfBirth:
              patientForm.dateOfBirth,
            gender: patientForm.gender,
            role: "patient",
            registrationStatus: "complete",
            createdAt:
              new Date().toISOString(),
          },
          accountEmail,
        );

        window.localStorage.setItem(
          "arogya-patient-onboarded",
          "true",
        );

        router.push("/patient");
      } catch (error) {
        console.error(
          "Patient registration failed:",
          error,
        );

        setErrors({
          identifier:
            "Unable to create your account. Please try again.",
        });
      } finally {
        setPending(false);
      }

      return;
    }

    /*
     * SIGN IN
     */
    if (
      !identifier.trim() ||
      !patientForm.password.trim()
    ) {
      setErrors({
        identifier:
          "Enter your email or mobile number.",
        password:
          "Enter your password.",
      });

      return;
    }

    setPending(true);

    try {
      const response =
        await signInClinic({
          email: identifier.trim(),
          password:
            patientForm.password,
          role:
            openRole === "doctor"
              ? "staff"
              : "patient",
        });

      if (!response.ok) {
        setErrors({
          identifier:
            response.message ||
            "Invalid email or password.",
        });

        return;
      }

      if (openRole === "patient") {
        window.localStorage.setItem(
          "arogya-patient-onboarded",
          "true",
        );
      }

      router.push(
        openRole === "doctor"
          ? "/staff"
          : "/patient",
      );
    } catch (error) {
      console.error(
        "Sign in failed:",
        error,
      );

      setErrors({
        identifier:
          "Unable to sign in. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  const renderPanel = (
    role: PortalRole,
  ) => {
    const open = openRole === role;
    const patient = role === "patient";

    return (
      <section
        className={`portal-panel ${
          patient
            ? "panel--patient"
            : "panel--doctor"
        }`}
      >
        <div className="jali-motif pointer-events-none absolute inset-0" />

        {!open ? (
          /*
           * PORTAL TRIGGER
           */
          <button
            type="button"
            className="portal-panel__trigger"
            aria-expanded={false}
            aria-label={
              patient
                ? "Open patient portal"
                : "Open doctor portal"
            }
            onClick={() => {
              openPanel(role);
            }}
          >
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/80">
              {patient
                ? "Patient portal"
                : "Doctor portal"}
            </span>

            <span className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.05]">
              {patient
                ? "I am a Patient"
                : "I am a Doctor"}
            </span>

            <span className="max-w-[34ch] text-base text-white/85">
              {patient
                ? "Find the right doctor, choose a time, and keep your care information close."
                : "Run your schedule, follow up with patients, and keep today moving safely."}
            </span>
          </button>
        ) : (
          <div className="portal-panel__form">
            <LoginPanel
              role={role}
              mode={patientMode}
              setMode={setPatientMode}
              identifier={identifier}
              patientForm={patientForm}
              errors={errors}
              pending={pending}
              firstFieldRef={firstFieldRef}
              updatePatientField={
                updatePatientField
              }
              blurPatientField={
                blurPatientField
              }
              setIdentifier={
                setIdentifier
              }
              touched={touched}
              attempted={attempted}
              onSubmit={handleSubmit}
              onBack={closePanel}
              onDemo={(demoRole) => {
                void enterDemo(demoRole);
              }}
            />
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="relative min-h-screen w-full max-w-none overflow-hidden p-0">
      <header className="landing-wordmark pointer-events-auto absolute left-1/2 top-6 z-40 w-full -translate-x-1/2 px-4 text-center text-white md:top-8">
        {prototypeMode ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                void enterDemo("patient");
              }}
              className="absolute left-4 top-0 min-h-11 rounded-[6px] border border-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-60 md:left-8"
            >
              Demo patient
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => {
                void enterDemo("doctor");
              }}
              className="absolute right-4 top-0 min-h-11 rounded-[6px] border border-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-60 md:right-8"
            >
              Demo doctor
            </button>
          </>
        ) : null}

        <p className="font-serif text-xl font-semibold md:text-2xl">
          Arogya Chikitsalaya
        </p>

        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em]">
          Clinic
        </p>
      </header>

      <section
        className="portal-split"
        data-open={openRole ?? "balanced"}
      >
        {renderPanel("patient")}
        {renderPanel("doctor")}
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen bg-care-700"
          aria-label="Loading portal"
        />
      }
    >
      <SplitLandingPage />
    </Suspense>
  );
}

function LoginPanel({
  role,
  mode,
  setMode,
  identifier,
  patientForm,
  errors,
  pending,
  firstFieldRef,
  updatePatientField,
  blurPatientField,
  setIdentifier,
  touched,
  attempted,
  onSubmit,
  onBack,
  onDemo,
}: {
  role: PortalRole;
  mode: PatientMode;
  setMode: (mode: PatientMode) => void;
  identifier: string;
  patientForm: PatientForm;
  errors: FieldErrors;
  pending: boolean;
  firstFieldRef: React.RefObject<
    HTMLInputElement | null
  >;
  updatePatientField: (
    field: keyof PatientForm,
    value: string | boolean,
  ) => void;
  blurPatientField: (
    field: keyof FieldErrors,
  ) => void;
  setIdentifier: (value: string) => void;
  touched: Partial<
    Record<keyof FieldErrors, boolean>
  >;
  attempted: boolean;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>,
  ) => void;
  onBack: () => void;
  onDemo: (role: PortalRole) => void;
}) {
  const doctor = role === "doctor";

  const signup =
    !doctor && mode === "signup";

  const visibleError = (
    name: keyof FieldErrors,
  ) => attempted || touched[name];

  const field = (
    name: keyof FieldErrors,
    message: string | undefined,
  ) =>
    message && visibleError(name) ? (
      <span
        id={`${name}-error`}
        className="portal-form-card__error"
        role="alert"
      >
        {message}
      </span>
    ) : null;

  return (
    <div
      className={`portal-form-card ${
        doctor
          ? "portal-form-card--doctor"
          : "portal-form-card--patient"
      }`}
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 text-sm font-semibold text-ink-700 underline underline-offset-4"
      >
        ← Back to portals
      </button>

      {prototypeMode ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              onDemo("patient");
            }}
            className="min-h-11 rounded-[6px] bg-care-700 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enter as demo patient
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              onDemo("doctor");
            }}
            className="min-h-11 rounded-[6px] bg-clinic-800 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Enter as demo doctor
          </button>
        </div>
      ) : null}

      {!doctor ? (
        <div className="mt-3 grid grid-cols-2 rounded-[6px] bg-surface-warm p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
            }}
            className={`min-h-11 rounded-[6px] text-sm font-semibold ${
              !signup
                ? "bg-surface text-care-700 shadow-sm"
                : "text-ink-500"
            }`}
          >
            Sign in
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
            }}
            className={`min-h-11 rounded-[6px] text-sm font-semibold ${
              signup
                ? "bg-surface text-care-700 shadow-sm"
                : "text-ink-500"
            }`}
          >
            New here? Create account
          </button>
        </div>
      ) : null}

      <p
        className={`mt-4 text-xs font-medium uppercase tracking-[0.12em] ${
          doctor
            ? "text-clinic-800"
            : "text-care-700"
        }`}
      >
        {doctor
          ? "Doctor portal"
          : signup
            ? "New patient account"
            : "Patient portal"}
      </p>

      <h2 className="mt-2 font-serif text-3xl font-semibold text-ink-900">
        {signup
          ? "Create your account"
          : "Sign in to continue"}
      </h2>

      <form
        onSubmit={onSubmit}
        className="mt-5 grid gap-3"
        noValidate
      >
        {signup ? (
          <>
            <div>
              <label
                htmlFor="fullName"
                className="block text-ink-700"
              >
                Full name
              </label>

              <input
                id="fullName"
                ref={firstFieldRef}
                value={patientForm.fullName}
                onChange={(event) =>
                  updatePatientField(
                    "fullName",
                    event.target.value,
                  )
                }
                onBlur={() =>
                  blurPatientField("fullName")
                }
                aria-invalid={Boolean(
                  errors.fullName &&
                    visibleError("fullName"),
                )}
                aria-describedby={
                  errors.fullName
                    ? "fullName-error"
                    : undefined
                }
                autoComplete="name"
              />

              {field(
                "fullName",
                errors.fullName,
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-ink-700"
              >
                Mobile number
              </label>

              <input
                id="phone"
                value={patientForm.phone}
                onChange={(event) =>
                  updatePatientField(
                    "phone",
                    event.target.value,
                  )
                }
                onBlur={() =>
                  blurPatientField("phone")
                }
                aria-invalid={Boolean(
                  errors.phone &&
                    visibleError("phone"),
                )}
                aria-describedby={
                  errors.phone
                    ? "phone-error"
                    : undefined
                }
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />

              {field(
                "phone",
                errors.phone,
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-ink-700"
              >
                Email (optional)
              </label>

              <input
                id="email"
                value={patientForm.email}
                onChange={(event) =>
                  updatePatientField(
                    "email",
                    event.target.value,
                  )
                }
                onBlur={() =>
                  blurPatientField("email")
                }
                aria-invalid={Boolean(
                  errors.email &&
                    visibleError("email"),
                )}
                aria-describedby={
                  errors.email
                    ? "email-error"
                    : undefined
                }
                autoComplete="email"
              />

              {field(
                "email",
                errors.email,
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-ink-700"
                >
                  Date of birth
                </label>

                <input
                  id="dateOfBirth"
                  type="date"
                  value={
                    patientForm.dateOfBirth
                  }
                  onChange={(event) =>
                    updatePatientField(
                      "dateOfBirth",
                      event.target.value,
                    )
                  }
                  onBlur={() =>
                    blurPatientField(
                      "dateOfBirth",
                    )
                  }
                  aria-invalid={Boolean(
                    errors.dateOfBirth &&
                      visibleError(
                        "dateOfBirth",
                      ),
                  )}
                  aria-describedby={
                    errors.dateOfBirth
                      ? "dateOfBirth-error"
                      : undefined
                  }
                />

                {field(
                  "dateOfBirth",
                  errors.dateOfBirth,
                )}
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-ink-700"
                >
                  Gender
                </label>

                <select
                  id="gender"
                  value={patientForm.gender}
                  onChange={(event) =>
                    updatePatientField(
                      "gender",
                      event.target.value,
                    )
                  }
                  onBlur={() =>
                    blurPatientField("gender")
                  }
                  aria-invalid={Boolean(
                    errors.gender &&
                      visibleError("gender"),
                  )}
                  aria-describedby={
                    errors.gender
                      ? "gender-error"
                      : undefined
                  }
                >
                  <option value="">
                    Select
                  </option>

                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>

                  <option>
                    Prefer not to say
                  </option>
                </select>

                {field(
                  "gender",
                  errors.gender,
                )}
              </div>
            </div>
          </>
        ) : (
          <div>
            <label
              htmlFor="identifier"
              className="block text-ink-700"
            >
              Email or mobile
            </label>

            <input
              id="identifier"
              ref={firstFieldRef}
              value={identifier}
              onChange={(event) =>
                setIdentifier(
                  event.target.value,
                )
              }
              onBlur={() =>
                blurPatientField("identifier")
              }
              aria-invalid={Boolean(
                errors.identifier &&
                  visibleError("identifier"),
              )}
              aria-describedby={
                errors.identifier
                  ? "identifier-error"
                  : undefined
              }
              autoComplete="username"
            />

            {field(
              "identifier",
              errors.identifier,
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-ink-700"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            minLength={
              prototypeMode ? 1 : 6
            }
            value={patientForm.password}
            onChange={(event) =>
              updatePatientField(
                "password",
                event.target.value,
              )
            }
            onBlur={() =>
              blurPatientField("password")
            }
            aria-invalid={Boolean(
              errors.password &&
                visibleError("password"),
            )}
            aria-describedby={
              errors.password
                ? "password-error"
                : undefined
            }
            autoComplete={
              signup
                ? "new-password"
                : "current-password"
            }
          />

          {field(
            "password",
            errors.password,
          )}
        </div>

        {signup && !prototypeMode ? (
          <div className="flex items-start gap-2 text-sm text-ink-700">
            <input
              id="consent"
              type="checkbox"
              checked={patientForm.consent}
              onChange={(event) =>
                updatePatientField(
                  "consent",
                  event.target.checked,
                )
              }
              className="portal-form-card__checkbox"
              aria-invalid={Boolean(
                errors.consent,
              )}
              aria-describedby={
                errors.consent
                  ? "consent-error"
                  : undefined
              }
            />

            <label
              htmlFor="consent"
              className="mb-0 text-ink-700"
            >
              I consent to the clinic
              storing my account and
              appointment information.
            </label>
          </div>
        ) : null}

        {!prototypeMode
          ? field(
              "consent",
              errors.consent,
            )
          : null}

        <button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full rounded-[6px] px-4 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? signup
              ? "Creating account..."
              : "Signing in..."
            : signup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs text-ink-500">
        {doctor
          ? "Password-only staff access. Contact clinic admin for access."
          : signup
            ? prototypeMode
              ? "Prototype signup only needs a name and password."
              : "Phone verification is required before confirming your first booking."
            : "Patient sessions stay signed in for convenience."}
      </p>
    </div>
  );
}
